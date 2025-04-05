// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IAEth} from "./IAEth.sol";

interface ICompoundETHManager {
    function deposit(uint256 amount) external payable;

    function withdraw(uint256 amount) external;
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface ICEth {
    function mint() external payable;
    function redeem(uint256 redeemTokens) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function transfer(address dst, uint256 amount) external returns (bool);
}

interface IAaveETHManager {
    function depositETH() external payable;

    function withdrawETH(uint256 amount) external;
}

contract Intents {
    IAaveETHManager public immutable aaveManager;
    IAEth public immutable aEth;
    ICEth private immutable cEth;
    address private immutable compoundaddress;
    ICompoundETHManager public immutable compoundManager;
    address constant aEthAddress = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;
    address constant cEthAddress = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;


    error InvalidSyntax();
    error InvalidCharacter();

    struct StringPart {
        uint256 start;
        uint256 end;
    }

    constructor(
        address _aaveManager,
        address _compoundManager
    ) {
        require(_aaveManager != address(0), "Invalid manager address");
        require(aEthAddress != address(0), "Invalid aETH address");
        require(
            _compoundManager != address(0),
            "Invalid compound manager address"
        );
        compoundaddress = _compoundManager;
        aaveManager = IAaveETHManager(_aaveManager);
        aEth = IAEth(aEthAddress);
        compoundManager = ICompoundETHManager(_compoundManager);
        cEth = ICEth(cEthAddress);
    }

    function command(string calldata intent) external payable {
        bytes memory normalized = _lowercase(bytes(intent));
        StringPart[] memory parts = _split(normalized, " ");

        if (parts.length != 4) revert InvalidSyntax(); // Expect "action amount ETH protocol"

        bytes32 action = keccak256(_getPart(normalized, parts[0]));
        bytes memory amount = _getPart(normalized, parts[1]);
        bytes32 protocol = keccak256(_getPart(normalized, parts[3]));

        if (protocol == keccak256("aave")) {
            if (action == keccak256("deposit")) {
                _depositAave(_toUint(amount, 18, true));
            } else if (action == keccak256("withdraw")) {
                _withdrawAave(_toUint(amount, 18, false));
                (bool ok, ) = payable(msg.sender).call{
                    value: address(this).balance
                }("");
                require(ok, "eth back to user didnt happen");
            } else {
                revert InvalidSyntax();
            }
        } else if (protocol == keccak256("compound")) {
            if (action == keccak256("deposit")) {
                _depositCompound(_toUint(amount, 18, true));
            } else if (action == keccak256("withdraw")) {
                _withdrawCompound(_toUint(amount, 18, false));
                (bool ok, ) = payable(msg.sender).call{
                    value: address(this).balance
                }("");
                require(ok, "eth back to user didnt happen");
            } else {
                revert InvalidSyntax();
            }
        } else {
            revert InvalidSyntax();
        }
    }

    function _depositAave(uint256 amount) internal {
        require(msg.value == amount, "Ether sent mismatch with amount.");
        aaveManager.depositETH{value: amount}();
        uint256 aEthBalance = aEth.balanceOf(address(this));
        aEth.transfer(msg.sender, aEthBalance);
    }

    function _withdrawAave(uint256 amount) internal {
        aaveManager.withdrawETH(amount);
    }

    function _depositCompound(uint256 amount) internal {
        require(msg.value == amount, "Ether sent mismatch with amount.");
        (bool success, ) = address(compoundManager).call{value: amount}(
            abi.encodeWithSignature("depositETH()")
        );
        require(success, "Deposit failed.");
        cEth.transfer(msg.sender, cEth.balanceOf(address(this)));
    }

    function _withdrawCompound(uint256 amount) internal {
        (bool success, ) = address(compoundManager).call(
            abi.encodeWithSignature("withdrawETH(uint256)", amount)
        );
        require(success, "Withdrawal failed.");
    }

    function _split(
        bytes memory base,
        string memory delimiter
    ) internal pure returns (StringPart[] memory parts) {
        require(
            bytes(delimiter).length == 1,
            "Delimiter must be one character"
        );
        bytes1 del = bytes(delimiter)[0];
        uint256 len = base.length;
        uint256 count;

        unchecked {
            for (uint256 i = 0; i < len; ++i) {
                if (base[i] == del) count++;
            }

            parts = new StringPart[](count + 1);
            uint256 partIndex;
            uint256 start;

            for (uint256 i; i <= len; ++i) {
                if (i == len || base[i] == del) {
                    parts[partIndex++] = StringPart(start, i);
                    start = i + 1;
                }
            }
        }
    }

    function _getPart(
        bytes memory base,
        StringPart memory part
    ) internal pure returns (bytes memory result) {
        result = new bytes(part.end - part.start);
        for (uint256 i = 0; i < result.length; ++i) {
            result[i] = base[part.start + i];
        }
    }

    function _lowercase(
        bytes memory subject
    ) internal pure returns (bytes memory result) {
        result = new bytes(subject.length);
        for (uint256 i = 0; i < subject.length; ++i) {
            bytes1 b = subject[i];
            result[i] = (b >= 0x41 && b <= 0x5A) ? bytes1(uint8(b) + 32) : b;
        }
    }

    function _toUint(
        bytes memory s,
        uint256 decimals,
        bool scale
    ) internal pure returns (uint256 result) {
        unchecked {
            uint256 len = s.length;
            bool hasDecimal;
            uint256 decimalPlaces;

            for (uint256 i; i < len; ++i) {
                bytes1 c = s[i];
                if (c >= 0x30 && c <= 0x39) {
                    // '0' to '9'
                    result = result * 10 + (uint256(uint8(c)) - 48);
                    if (hasDecimal) {
                        if (++decimalPlaces > decimals) break;
                    }
                } else if (c == 0x2E && !hasDecimal) {
                    // '.'
                    hasDecimal = true;
                } else {
                    revert InvalidCharacter();
                }
            }

            if (scale) {
                if (!hasDecimal) result *= 10 ** decimals;
                else if (decimalPlaces < decimals)
                    result *= 10 ** (decimals - decimalPlaces);
            }
        }
    }

    receive() external payable {}

    fallback() external payable {}
}