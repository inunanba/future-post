// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// LOCAL TEST ONLY. Its runtime code is placed at 0x...0a02 in a local
/// Ganache chain so the unmodified production FuturePostReleaseV2 calls it.
/// Never deployed to any network.
contract MockPqcKeyStatus {
    struct Status { bool registered; uint8 algorithmId; bool possessionProven; }
    mapping(address => Status) public statusOf;
    /// 0 = well-formed answer, 1 = revert, 2 = empty return, 3 = short garbage,
    /// 4 = non-boolean flag word
    uint256 public mode;

    function set(address account, bool registered, uint8 algorithmId, bool possessionProven) external {
        statusOf[account] = Status(registered, algorithmId, possessionProven);
    }

    function setMode(uint256 m) external { mode = m; }

    function pqcKeyStatus(address account)
        external
        view
        returns (bool, uint8, bytes memory, bool)
    {
        uint256 m = mode;
        if (m == 1) revert("inactive");
        if (m == 2) assembly { return(0, 0) }
        if (m == 3) assembly { mstore(0, 1) return(0, 64) }
        if (m == 4) {
            assembly {
                mstore(0, 2)
                mstore(32, 1)
                mstore(64, 128)
                mstore(96, 1)
                mstore(128, 0)
                return(0, 160)
            }
        }
        Status memory s = statusOf[account];
        bytes memory pk = s.registered ? new bytes(2592) : new bytes(0);
        return (s.registered, s.algorithmId, pk, s.possessionProven);
    }
}
