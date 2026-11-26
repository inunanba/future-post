// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FuturePostReleaseV2
/// @notice Same letter policy as FuturePostRelease (v1), plus one rule:
///         a letter can be registered only by a sender whose account has a
///         registered ML-DSA-87 key with proof of possession, as reported by
///         QoreChain's PQC Key Status precompile (pqcKeyStatus, 0x...0a02).
///         The check runs at registration only, so a letter that was valid when
///         it was registered can always be released by its sender on time.
///         The recipient binding is an opaque hash; this contract does not
///         check a recipient key.
contract FuturePostReleaseV2 {
    /// QoreChain PQC Key Status precompile (lowercase). Fixed in source: there
    /// is no constructor argument and no setter. Declared immutable so the full
    /// 20-byte address appears as a literal word in the deployed runtime code.
    address public immutable PQC_KEY_STATUS = 0x0000000000000000000000000000000000000a02;
    /// ML-DSA-87 algorithm id reported by pqcKeyStatus.
    uint8 public constant ALGORITHM_ML_DSA_87 = 1;

    error LetterExists();
    error LetterMissing();
    error InvalidUnlockTime();
    error InvalidShare();
    error NotSender();
    error TooEarly(uint64 unlockAt, uint64 currentTime);
    error AlreadyReleased();
    /// The precompile call failed, returned nothing, or returned data that is
    /// not a well-formed (bool, uint8, bytes, bool) tuple. Fails closed.
    error PrecompileInactiveOrMalformed();
    /// The sender has no registered ML-DSA-87 key with proof of possession.
    error SenderKeyNotProven(bool registered, uint8 algorithmId, bool possessionProven);

    struct Letter {
        address sender;
        bytes32 recipientBinding;
        uint64 unlockAt;
        bytes32 ciphertextHash;
        bytes32 shareBCommitment;
        bool released;
    }

    mapping(bytes32 letterId => Letter) private letters;

    event LetterRegistered(
        bytes32 indexed letterId,
        address indexed sender,
        bytes32 indexed recipientBinding,
        uint64 unlockAt,
        bytes32 ciphertextHash,
        bytes32 shareBCommitment
    );

    /// Share B is intentionally public after unlock. It is useless without
    /// share A, which is sealed to the recipient with QoreSeal.
    event ShareBReleased(bytes32 indexed letterId, bytes shareB, uint64 releasedAt);

    /// Reads pqcKeyStatus(account) from the fixed precompile with a read-only
    /// call (no value) and reverts unless the account has a registered
    /// ML-DSA-87 key with possession proven.
    function _requireProvenMldsa87(address account) internal view {
        (bool ok, bytes memory ret) =
            PQC_KEY_STATUS.staticcall(abi.encodeWithSignature("pqcKeyStatus(address)", account));
        // Head: bool, uint8, offset(bytes), bool; then bytes length word.
        if (!ok || ret.length < 160) revert PrecompileInactiveOrMalformed();
        uint256 registered;
        uint256 algorithmId;
        uint256 offset;
        uint256 possessionProven;
        assembly {
            registered := mload(add(ret, 32))
            algorithmId := mload(add(ret, 64))
            offset := mload(add(ret, 96))
            possessionProven := mload(add(ret, 128))
        }
        if (registered > 1 || algorithmId > type(uint8).max || possessionProven > 1) {
            revert PrecompileInactiveOrMalformed();
        }
        if (offset < 128 || offset > ret.length - 32) revert PrecompileInactiveOrMalformed();
        uint256 pubkeyLength;
        assembly {
            pubkeyLength := mload(add(add(ret, 32), offset))
        }
        if (pubkeyLength > ret.length - 32 - offset) revert PrecompileInactiveOrMalformed();
        if (registered != 1 || algorithmId != ALGORITHM_ML_DSA_87 || possessionProven != 1) {
            revert SenderKeyNotProven(registered == 1, uint8(algorithmId), possessionProven == 1);
        }
    }

    function registerLetter(
        bytes32 letterId,
        bytes32 recipientBinding,
        uint64 unlockAt,
        bytes32 ciphertextHash,
        bytes32 shareBCommitment
    ) external {
        if (letters[letterId].sender != address(0)) revert LetterExists();
        if (unlockAt <= block.timestamp) revert InvalidUnlockTime();
        if (recipientBinding == bytes32(0) || ciphertextHash == bytes32(0) || shareBCommitment == bytes32(0)) {
            revert InvalidShare();
        }
        _requireProvenMldsa87(msg.sender);

        letters[letterId] = Letter({
            sender: msg.sender,
            recipientBinding: recipientBinding,
            unlockAt: unlockAt,
            ciphertextHash: ciphertextHash,
            shareBCommitment: shareBCommitment,
            released: false
        });

        emit LetterRegistered(
            letterId,
            msg.sender,
            recipientBinding,
            unlockAt,
            ciphertextHash,
            shareBCommitment
        );
    }

    /// No key-status check here on purpose: a later key rotation or a
    /// precompile outage must not lock a letter that was registered validly.
    function releaseShareB(bytes32 letterId, bytes calldata shareB) external {
        Letter storage letter = letters[letterId];
        if (letter.sender == address(0)) revert LetterMissing();
        if (msg.sender != letter.sender) revert NotSender();
        if (letter.released) revert AlreadyReleased();
        if (block.timestamp < letter.unlockAt) {
            revert TooEarly(letter.unlockAt, uint64(block.timestamp));
        }
        if (shareB.length != 32 || keccak256(shareB) != letter.shareBCommitment) {
            revert InvalidShare();
        }

        letter.released = true;
        emit ShareBReleased(letterId, shareB, uint64(block.timestamp));
    }

    function getLetter(bytes32 letterId) external view returns (Letter memory) {
        Letter memory letter = letters[letterId];
        if (letter.sender == address(0)) revert LetterMissing();
        return letter;
    }
}
