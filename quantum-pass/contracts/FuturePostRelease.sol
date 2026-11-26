// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title FuturePostRelease
/// @notice Records a letter's opening policy and publishes sender-held share B
///         only after the chosen time. Letter encryption and QoreSeal opening
///         remain client-side. This contract is an audit/policy boundary, not a
///         source of cryptographic time.
contract FuturePostRelease {
    error LetterExists();
    error LetterMissing();
    error InvalidUnlockTime();
    error InvalidShare();
    error NotSender();
    error TooEarly(uint64 unlockAt, uint64 currentTime);
    error AlreadyReleased();

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
