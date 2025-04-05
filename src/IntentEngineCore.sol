// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {UniswapRegistry} from "./UniswapRegistry.sol";
import {IUniswap} from "./IUniswap.sol";

interface ICEth {
    function mint() external payable;
    function redeem(uint256 redeemTokens) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function transfer(address dst, uint256 amount) external returns (bool);
}

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IWETH {
    function deposit() external payable;
    function balanceOf(address) external view returns (uint);
    function transfer(address dst, uint wad) external returns (bool);
}

interface IAEth {
    function balanceOf(address owner) external view returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function transfer(address dst, uint256 amount) external returns (bool);
}

interface IAaveETHManager {
    function depositETH() external payable;
    function withdrawETH(uint256 amount) external;
}

interface ICompoundETHManager {
    function deposit(uint256 amount) external payable;
    function withdraw(uint256 amount) external;
}

contract IntentEngine is UniswapRegistry {
    error InvalidSyntax();
    error InvalidCharacter();

    // Constants - immutable for gas savings
    address private immutable WETH_ADDRESS;
    address private immutable UNISWAP_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    uint256 private constant DEADLINE_OFFSET = 3000;

    // Protocol interfaces
    IAaveETHManager public immutable aaveManager;
    IAEth public immutable aEth;
    ICEth private immutable cEth;
    IWETH private immutable weth;
    ICompoundETHManager public immutable compoundManager;

    struct StringPart {
        uint256 start;
        uint256 end;
    }

    constructor(address _aaveManager, address _compoundManager) {
        WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        address aEthAddress = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;
        address cEthAddress = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;
        
        require(_aaveManager != address(0), "Invalid manager address");
        require(aEthAddress != address(0), "Invalid aETH address");
        require(_compoundManager != address(0), "Invalid compound manager address");
        
        aaveManager = IAaveETHManager(_aaveManager);
        aEth = IAEth(aEthAddress);
        compoundManager = ICompoundETHManager(_compoundManager);
        cEth = ICEth(cEthAddress);
        weth = IWETH(WETH_ADDRESS);
    }

    function commandToTrade(string calldata intent) external payable returns (uint256 amount, string memory protocol) {
        address client = msg.sender;
        bytes memory normalized = _lowercase(bytes(intent));
        StringPart[] memory parts = _split(normalized, " ");

        if (parts.length != 4) revert InvalidSyntax();

        string memory command = string(_getPart(normalized, parts[0])); // buy/sell/deposit/withdraw
        string memory token = string(_getPart(normalized, parts[1]));   // token
        bytes memory amountBytes = _getPart(normalized, parts[2]);      // amount
        protocol = string(_getPart(normalized, parts[3]));              // protocol

        amount = _toUint(amountBytes, 18, true);
        bytes32 commandHash = keccak256(abi.encodePacked(command));
        bytes32 protocolHash = keccak256(abi.encodePacked(protocol));
        
        // Buy command
        if (commandHash == keccak256(abi.encodePacked("buy"))) {
            if (protocolHash == keccak256(abi.encodePacked("uniswap"))) {
                _swapUniswap(WETH_ADDRESS, getAddressFromString(token), client, amount);
            }
        } 
        // Sell command
        else if (commandHash == keccak256(abi.encodePacked("sell"))) {
            if (protocolHash == keccak256(abi.encodePacked("uniswap"))) {
                _swapUniswap(getAddressFromString(token), WETH_ADDRESS, client, amount);
            }
        } 
        // Deposit command
        else if (commandHash == keccak256(abi.encodePacked("deposit"))) {
            if (protocolHash == keccak256(abi.encodePacked("aave"))) {
                _depositAave(amount);

            } else if (protocolHash == keccak256(abi.encodePacked("compound"))) {
                _depositCompound(amount);
            } else {
                revert InvalidSyntax();
            }
        }
        // Withdraw functionality commented out in original code
        return (amount, protocol);
    }

    function _swapUniswap(address token1, address token2, address client, uint256 amount) private {
        address[] memory path = new address[](2);
        path[0] = token1;
        path[1] = token2;
        
        IERC20(token1).transferFrom(client, address(this), amount);
        IERC20(token1).approve(UNISWAP_ROUTER, amount);
        
        IUniswap(UNISWAP_ROUTER).swapExactTokensForTokens(
            amount,
            0,
            path,
            client,
            block.timestamp + DEADLINE_OFFSET
        );
    }

    function _split(bytes memory base, string memory delimiter) internal pure returns (StringPart[] memory parts) {
        require(bytes(delimiter).length == 1, "Delimiter must be one character");
        bytes1 del = bytes(delimiter)[0];
        uint256 len = base.length;
        uint256 count;

        // Count delimiters
        for (uint256 i = 0; i < len; ++i) {
            if (base[i] == del) count++;
        }

        parts = new StringPart[](count + 1);
        uint256 partIndex;
        uint256 start;

        // Split string
        for (uint256 i; i <= len; ++i) {
            if (i == len || base[i] == del) {
                parts[partIndex++] = StringPart(start, i);
                start = i + 1;
            }
        }
    }

    function _getPart(bytes memory base, StringPart memory part) internal pure returns (bytes memory) {
        bytes memory result = new bytes(part.end - part.start);
        for (uint256 i = 0; i < result.length; ++i) {
            result[i] = base[part.start + i];
        }
        return result;
    }

    function _lowercase(bytes memory subject) internal pure returns (bytes memory) {
        bytes memory result = new bytes(subject.length);
        for (uint256 i = 0; i < subject.length; ++i) {
            bytes1 b = subject[i];
            result[i] = (b >= 0x41 && b <= 0x5A) ? bytes1(uint8(b) + 32) : b;
        }
        return result;
    }

    function _toUint(bytes memory s, uint256 decimals, bool scale) internal pure returns (uint256 result) {
        uint256 len = s.length;
        bool hasDecimal;
        uint256 decimalPlaces;

        for (uint256 i; i < len; ++i) {
            bytes1 c = s[i];
            if (c >= 0x30 && c <= 0x39) { // '0' to '9'
                result = result * 10 + (uint256(uint8(c)) - 48);
                if (hasDecimal) {
                    if (++decimalPlaces > decimals) break;
                }
            } else if (c == 0x2E && !hasDecimal) { // '.'
                hasDecimal = true;
            } else {
                revert InvalidCharacter();
            }
        }

        if (scale) {
            if (!hasDecimal) result *= 10 ** decimals;
            else if (decimalPlaces < decimals) result *= 10 ** (decimals - decimalPlaces);
        }
    }

    function getWETH(uint256 amount) public payable returns (uint256) {
        require(msg.value == amount, "Incorrect ETH amount sent");
        weth.deposit{value: amount}();
        uint256 wethBalance = weth.balanceOf(address(this));
        weth.transfer(msg.sender, wethBalance);
        return wethBalance;
    }

    function _depositAave(uint256 amount) internal {
        require(msg.value == amount, "Ether sent mismatch with amount");
        aaveManager.depositETH{value: amount}();
        uint256 aEthBalance = aEth.balanceOf(address(this));
        aEth.transfer(msg.sender, aEthBalance);
    }

    function _withdrawAave(uint256 amount) internal {
        aaveManager.withdrawETH(amount);
    }

    function _depositCompound(uint256 amount) internal {
        require(msg.value == amount, "Ether sent mismatch with amount");
        (bool success, ) = address(compoundManager).call{value: amount}(
            abi.encodeWithSignature("depositETH()")
        );
        require(success, "Deposit failed");
        cEth.transfer(msg.sender, cEth.balanceOf(address(this)));
    }

    function _withdrawCompound(uint256 amount) internal {
        (bool success, ) = address(compoundManager).call(
            abi.encodeWithSignature("withdrawETH(uint256)", amount)
        );
        require(success, "Withdrawal failed");
    }

    // Getter function
    function returnIntentValues(string memory intent) public view returns (
        address token1, 
        address token2, 
        uint256 amount, 
        string memory protocol
    ) {
        bytes memory normalized = _lowercase(bytes(intent));
        StringPart[] memory parts = _split(normalized, " ");

        if (parts.length != 4) revert InvalidSyntax();

        string memory tokenStr1 = string(_getPart(normalized, parts[0]));
        string memory tokenStr2 = string(_getPart(normalized, parts[1]));
        bytes memory amountBytes = _getPart(normalized, parts[2]);
        protocol = string(_getPart(normalized, parts[3]));
        
        amount = _toUint(amountBytes, 18, true);
        token1 = getAddressFromString(tokenStr1);
        token2 = getAddressFromString(tokenStr2);
    }

    receive() external payable {}
    fallback() external payable {}
}