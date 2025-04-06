// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {UniswapRegistry} from "src/interfaces/UniswapRegistry.sol";
import {IERC20} from "src/interfaces/IERC20.sol";

interface IUniswap {
    // router address V02 : 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)  ;
}

contract IntentEngine is UniswapRegistry{

    error InvalidSyntax();
    error InvalidCharacter();

    // address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    // ==== Right now for testing its weth warna at time of trading is USDT
    address constant USDT = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; 
    
    struct StringPart {
        uint256 start;
        uint256 end;
    }

    function commandToTrade(
        string calldata intent
    ) external returns (uint256 amount, string memory protocol) {
        address client = msg.sender;
        bytes memory normalized = _lowercase(bytes(intent));
        StringPart[] memory parts = _split(normalized, " ");

        if (parts.length != 4) revert InvalidSyntax();

        string memory command = string(_getPart(normalized, parts[0])); //buy / sell
        string memory token = string(_getPart(normalized, parts[1])); //token
        bytes memory amountBytes = _extractAmount(normalized); //amount
        protocol = string(_getPart(normalized, parts[3])); //uniswap

        amount = _toUint(amountBytes, 18, true);

        //Buy 
        if(keccak256(abi.encodePacked(command)) ==
            keccak256(abi.encodePacked("buy"))){
            if (
                keccak256(abi.encodePacked(protocol)) ==
                keccak256(abi.encodePacked("uniswap"))
            ) {
                swapThroughUniswapV2(USDT,getAddressFromString(token),client,amount);
            }
        }

        //Sell 
        if(keccak256(abi.encodePacked(command)) ==
            keccak256(abi.encodePacked("sell"))){
            if (
                keccak256(abi.encodePacked(protocol)) ==
                keccak256(abi.encodePacked("uniswap"))
            ) {
                swapThroughUniswapV2(getAddressFromString(token),USDT,client,amount);
            }
        }
    

        return (amount, protocol);
    }

    function swapThroughUniswapV2(address token1, address token2,address client, uint256 amount) private {
        address[] memory pathArray = new address[](2);
        pathArray[0] = token1;
        pathArray[1] = token2;
        IERC20(pathArray[0]).transferFrom(client, address(this), amount);

        IERC20(token1).approve(
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D,
            amount
        );

        // Issue : UniswapV2Router:
        IUniswap(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D)
            .swapExactTokensForTokens(
                amount,
                0,
                pathArray,
                client,
                block.timestamp + 3000
        );

    }

    function _extractAmount(
        bytes memory normalizedIntent
    ) internal pure returns (bytes memory amount) {
        StringPart[] memory parts = _split(normalizedIntent, " ");
        return _getPart(normalizedIntent, parts[2]); // Extract the "amount" part
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

    // Getter Functions

    function returnIntentValues(
        string memory intent
    )
        public
        view
        returns (address, address, uint256 amount, string memory protocol)
    {
        bytes memory normalized = _lowercase(bytes(intent));
        StringPart[] memory parts = _split(normalized, " ");

        if (parts.length != 4) revert InvalidSyntax();

        string memory token1 = string(_getPart(normalized, parts[0])); //eth
        string memory token2 = string(_getPart(normalized, parts[1])); //dai
        bytes memory amountBytes = _extractAmount(normalized); //amount
        protocol = string(_getPart(normalized, parts[3])); //uniswap
        amount = _toUint(amountBytes, 18, true);

        address addToken1 = getAddressFromString(token1);
        address addToken2 = getAddressFromString(token2);

        return (addToken1, addToken2, amount, protocol);
    }
    

}

