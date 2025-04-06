// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC20} from "src/interfaces/IERC20.sol";
import {IAEth} from "src/interfaces/IAEth.sol";
import {AaveV3Interactor} from "src/aave/aave_core.sol";
import {UniswapRegistry} from "src/interfaces/UniswapRegistry.sol";
import {AAVETokenRegistry} from "src/interfaces/AAVETokenRegistry.sol";


interface ICompoundETHManager {
    function deposit(uint256 amount) external payable;

    function withdraw(uint256 amount) external;
}

interface ICEth {
    function mint() external payable;
    function redeem(uint256 redeemTokens) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function transfer(address dst, uint256 amount) external returns (bool);
}

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

contract IntentEngine is UniswapRegistry, AAVETokenRegistry {
    error InvalidSyntax();
    error InvalidCharacter();

    // address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    // ==== Right now for testing its weth warna at time of trading is USDT
    address constant USDT = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // AAVE AND COMPOUND
    IAEth public immutable aEth;
    ICEth private immutable cEth;
    address private immutable compoundaddress;
    ICompoundETHManager public immutable compoundManager;
    address constant aEthAddress = 0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8;
    address constant cEthAddress = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

    address immutable aave_core;

    struct StringPart {
        uint256 start;
        uint256 end;
    }

    constructor(address _compoundManager, address _aave_core) {
        require(aEthAddress != address(0), "Invalid aETH address");
        require(
            _compoundManager != address(0),
            "Invalid compound manager address"
        );
        compoundaddress = _compoundManager;
        aEth = IAEth(aEthAddress);
        compoundManager = ICompoundETHManager(_compoundManager);
        cEth = ICEth(cEthAddress);
        aave_core = _aave_core;
    }

    function commandToTrade(
        string calldata intent
    ) external returns (uint256 amount, string memory protocol) {
        address client = msg.sender;
        bytes memory normalized = _lowercase(bytes(intent));
        StringPart[] memory parts = _split(normalized, " ");

        if (parts.length != 4) revert InvalidSyntax();

        string memory command = string(_getPart(normalized, parts[0])); 
        string memory token = string(_getPart(normalized, parts[1])); //token  //Swap to
        bytes memory amountBytes = _extractAmount(normalized); //amount
        protocol = string(_getPart(normalized, parts[3])); //Protocol //Swap from

        amount = _toUint(amountBytes, 18, true);

        //Compound And AAVE

        //Deposit to AAVE or Compound
        if (
            keccak256(abi.encodePacked(command)) ==
            keccak256(abi.encodePacked("deposit"))
        ) {
            if (
                keccak256(abi.encodePacked(protocol)) ==
                keccak256(abi.encodePacked("aave"))
            ) {
                //=== AAVE DEPOSIT CALL
                AaveV3Interactor(aave_core).deposit(
                    getAddressFromString(token),
                    amount,
                    client
                );
            }
            if (
                keccak256(abi.encodePacked(protocol)) ==
                keccak256(abi.encodePacked("compound"))
            ) {
                _depositCompound(amount);
            } else {
                revert InvalidSyntax();
            }
        }

        // Withdraw from AAVE or Compound
        if (
            keccak256(abi.encodePacked(command)) ==
            keccak256(abi.encodePacked("withdraw"))
        ) {
            //!!! ==== Ask user to transfer aToken to interactor ==== !!! 
            // !!! If User wants to Withdraw USDC so he needs to transfer aUSDC to interactor
            // approve from user to spend his atoken by this contract
            // tx starts -> from user this contracts sends a token to interactor, then withdraw function called, withdraw done then tx stops
            
            if (
                keccak256(abi.encodePacked(protocol)) ==
                keccak256(abi.encodePacked("aave"))
            ) {
                IERC20(getAAVEAddressFromString(token)).transferFrom(client,aave_core,amount);
                AaveV3Interactor(aave_core).withdraw(
                    getAddressFromString(token),
                    amount,
                    client
                );
            }
            if (
                keccak256(abi.encodePacked(protocol)) ==
                keccak256(abi.encodePacked("compound"))
            ) {
                _withdrawCompound(amount); //@audit
                (bool ok, ) = payable(msg.sender).call{
                    value: address(this).balance
                }("");
                require(ok, "ETH back to user didnt happen");
            } else {
                revert InvalidSyntax();
            }
        }

        if (
            keccak256(abi.encodePacked(command)) ==
            keccak256(abi.encodePacked("sendtoaddress"))
        ) {
            // `protocol` is your 4th word, it will be address of recipient, e.g. "0xAbC123…"
            address recipient = hexStringToAddress(protocol);

            // now you can send ETH or ERC‑20 to `recipient`…
            if (
                keccak256(abi.encodePacked(token)) ==
                keccak256(abi.encodePacked("eth"))
            ) {
                (bool ok, ) = payable(recipient).call{value: amount}("");
                require(ok, "ETH transfer failed");

            } else {

                address tokenAddr = getAddressFromString(token);
                require(tokenAddr != address(0), "Unknown token");
                require(
                    IERC20(tokenAddr).transfer(recipient, amount),
                    "ERC20 transfer failed"
                );
            }
        }

        if (
            keccak256(abi.encodePacked(command)) ==
            keccak256(abi.encodePacked("swap"))
        ) {
            // Token Swap from "protocol" to token with Amount "amount"
            swapThroughUniswapV2(getAddressFromString(protocol),getAddressFromString(token),client,amount);
        }

        
        return (amount, protocol);
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

    function hexStringToAddress(
        string memory s
    ) public pure returns (address addr) {
        bytes memory b = bytes(s);
        require(b.length == 42, "Invalid address length");
        uint160 acc = 0;
        // skip "0x"
        for (uint i = 2; i < 42; i++) {
            acc <<= 4;
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                // '0'–'9'
                acc |= uint160(c - 48);
            } else if (c >= 65 && c <= 70) {
                // 'A'–'F'
                acc |= uint160(c - 55);
            } else if (c >= 97 && c <= 102) {
                // 'a'–'f'
                acc |= uint160(c - 87);
            } else {
                revert("Invalid hex character");
            }
        }
        return address(acc);
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

    receive() external payable {}

    fallback() external payable {}

    // Getter Functions

    function returnIntentValues(
        string memory intent
    )
        public
        view
        returns (
            string memory command,
            address token,
            uint256 amount,
            string memory protocol
        )
    {
        bytes memory normalized = _lowercase(bytes(intent));
        StringPart[] memory parts = _split(normalized, " ");

        if (parts.length != 4) revert InvalidSyntax();

        command = string(_getPart(normalized, parts[0]));
        string memory _token = string(_getPart(normalized, parts[1]));
        bytes memory amountBytes = _extractAmount(normalized);
        protocol = string(_getPart(normalized, parts[3]));
        amount = _toUint(amountBytes, 18, true);
        token = getAddressFromString(_token);
    }
}
