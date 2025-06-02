// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {SafeTransferLib} from "../../lib/solady/src/utils/SafeTransferLib.sol";
import {MetadataReaderLib} from "../../lib/solady/src/utils/MetadataReaderLib.sol";

/// @title Simplified Intents Engine
/// @notice Simple helper contract for turning transactional intents into executable code.
contract SimpleIE {
    /// @dev Token transfer library.
    using SafeTransferLib for address;
    
    /// @dev Token metadata reader library.
    using MetadataReaderLib for address;

    /// ======================= CUSTOM ERRORS ======================= ///
    error Overflow();
    error InvalidSwap();
    error InvalidSyntax();
    error InvalidCharacter();
    error InsufficientSwap();

    /// ========================== STRUCTS ========================== ///
    /// @dev The `swap()` command information struct.
    struct SwapInfo {
        bool ETHIn;
        bool ETHOut;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
    }

    /// @dev The `swap()` pool liquidity struct.
    struct SwapLiq {
        address pool;
        uint256 liq;
    }

    /// @dev The string start and end indices.
    struct StringPart {
        uint256 start;
        uint256 end;
    }

    /// ========================= CONSTANTS ========================= ///
    /// @dev The conventional ERC7528 ETH address.
    address internal constant ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /// @dev The canonical wrapped ETH address.
    address internal constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    /// @dev The Maker DAO USD stablecoin address.
    address internal constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    
    /// @dev The Circle USD stablecoin address.
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    /// @dev The Tether USD stablecoin address.
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    
    /// @dev The Wrapped Bitcoin token address.
    address internal constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

    /// @dev The address of the Uniswap V3 Factory.
    address internal constant UNISWAP_V3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

    /// @dev The Uniswap V3 Pool `initcodehash`.
    bytes32 internal constant UNISWAP_V3_POOL_INIT_CODE_HASH =
        0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

    /// @dev The minimum value that can be returned from `getSqrtRatioAtTick` (plus one).
    uint160 internal constant MIN_SQRT_RATIO_PLUS_ONE = 4295128740;

    /// @dev The maximum value that can be returned from `getSqrtRatioAtTick` (minus one).
    uint160 internal constant MAX_SQRT_RATIO_MINUS_ONE =
        1461446703485210103287273052203988822378723970341;
    
    /// ========================== STORAGE ========================== ///
    /// @dev Token names to addresses mapping.
    mapping(string name => address) public addresses;

    /// @dev Token addresses to names mapping.
    mapping(address addresses => string) public names;
    
    /// @dev Token swap pool routing on Uniswap V3.
    mapping(address token0 => mapping(address token1 => address)) public pairs;

    /// ===================== COMMAND EXECUTION ===================== ///
    /// @dev Executes a text command from an `intent` string.
    function command(string calldata intent) public payable {
        bytes memory normalized = _lowercase(bytes(intent));
        bytes32 action = _extraction(normalized);
        
        if (action == "send" || action == "transfer" || action == "pay") {
            (bytes memory to, bytes memory amount, bytes memory token) = _extractSend(normalized);
            send(string(to), string(amount), string(token));
        } else if (action == "swap" || action == "sell" || action == "exchange") {
            (
                bytes memory amountIn,
                bytes memory amountOutMin,
                bytes memory tokenIn,
                bytes memory tokenOut,
                bytes memory receiver
            ) = _extractSwap(normalized);
            swap(
                string(amountIn),
                string(amountOutMin),
                string(tokenIn),
                string(tokenOut),
                string(receiver)
            );
        } else {
            revert InvalidSyntax(); // Invalid command format.
        }
    }


    /// @dev Executes a `send` command from the parts of a matched intent string
    function send(string memory to, string memory amount, string memory token)
        public
        payable
    {
        address _token;
        uint256 decimals;
        if (bytes(token).length == 42) _token = _toAddress(bytes(token));
        else (_token, decimals) = _returnTokenConstants(bytes32(bytes(token)));
        if (_token == address(0)) _token = addresses[token];
        
        // Convert recipient address string to address, ensuring it's a valid address
        address _to;
        if (bytes(to).length == 42) {
            _to = _toAddress(bytes(to));
            require(_to != address(0), "Invalid recipient address");
        } else {
            revert InvalidSyntax();
        }
        
        uint256 _amount =
            _toUint(bytes(amount), decimals != 0 ? decimals : _token.readDecimals(), _token);

        if (_token == ETH) {
            require(msg.value == _amount, "Incorrect ETH value sent");
            _to.safeTransferETH(_amount);
        } else {
            _token.safeTransferFrom(msg.sender, _to, _amount);
        }
    }

    /// @dev Executes a `swap` command from the parts of a matched intent string
    function swap(
        string memory amountIn,
        string memory amountOutMin,
        string memory tokenIn,
        string memory tokenOut,
        string memory receiver
    ) public payable {
        SwapInfo memory info;
        uint256 decimalsIn;
        uint256 decimalsOut;
        
        if (bytes(tokenIn).length == 42) info.tokenIn = _toAddress(bytes(tokenIn));
        else (info.tokenIn, decimalsIn) = _returnTokenConstants(bytes32(bytes(tokenIn)));
        if (info.tokenIn == address(0)) info.tokenIn = addresses[tokenIn];
        
        if (bytes(tokenOut).length == 42) info.tokenOut = _toAddress(bytes(tokenOut));
        else (info.tokenOut, decimalsOut) = _returnTokenConstants(bytes32(bytes(tokenOut)));
        if (info.tokenOut == address(0)) info.tokenOut = addresses[tokenOut];

        uint256 minOut;
        if (bytes(amountOutMin).length != 0) {
            minOut = _toUint(
                bytes(amountOutMin),
                decimalsOut != 0 ? decimalsOut : info.tokenOut.readDecimals(),
                info.tokenOut
            );
        }

        bool exactOut = bytes(amountIn).length == 0;
        info.amountIn = exactOut
            ? minOut
            : _toUint(
                bytes(amountIn),
                decimalsIn != 0 ? decimalsIn : info.tokenIn.readDecimals(),
                info.tokenIn
            );

        if (info.amountIn >= 1 << 255) revert Overflow();
        info.ETHIn = info.tokenIn == ETH;
        if (info.ETHIn) require(msg.value == info.amountIn);
        if (info.ETHIn) info.tokenIn = WETH;
        info.ETHOut = info.tokenOut == ETH;
        if (info.ETHOut) info.tokenOut = WETH;

        address _receiver;
        if (bytes(receiver).length == 0) _receiver = msg.sender;
        else _receiver = _toAddress(bytes(receiver));

        (address pool, bool zeroForOne) = _computePoolAddress(info.tokenIn, info.tokenOut);
        (int256 amount0, int256 amount1) = ISwapRouter(pool).swap(
            !info.ETHOut ? _receiver : address(this),
            zeroForOne,
            !exactOut ? int256(info.amountIn) : -int256(info.amountIn),
            zeroForOne ? MIN_SQRT_RATIO_PLUS_ONE : MAX_SQRT_RATIO_MINUS_ONE,
            abi.encodePacked(
                info.ETHIn, info.ETHOut, msg.sender, info.tokenIn, info.tokenOut, _receiver
            )
        );

        if (minOut != 0) {
            if (uint256(-(zeroForOne ? amount1 : amount0)) < minOut) revert InsufficientSwap();
        }
    }

    /// @dev Fallback `uniswapV3SwapCallback`
    fallback() external payable {
        int256 amount0Delta;
        int256 amount1Delta;
        bool ETHIn;
        bool ETHOut;
        address payer;
        address tokenIn;
        address tokenOut;
        address receiver;
        
        assembly {
            amount0Delta := calldataload(0x4)
            amount1Delta := calldataload(0x24)
            ETHIn := byte(0, calldataload(0x84))
            ETHOut := byte(0, calldataload(add(0x84, 1)))
            payer := shr(96, calldataload(add(0x84, 2)))
            tokenIn := shr(96, calldataload(add(0x84, 22)))
            tokenOut := shr(96, calldataload(add(0x84, 42)))
            receiver := shr(96, calldataload(add(0x84, 62)))
        }
        
        if (amount0Delta <= 0 && amount1Delta <= 0) revert InvalidSwap();
        (address pool, bool zeroForOne) = _computePoolAddress(tokenIn, tokenOut);
        
        assembly {
            if iszero(eq(caller(), pool)) { revert(0, 0) }
        }
        
        if (ETHIn) {
            _wrapETH(uint256(zeroForOne ? amount0Delta : amount1Delta));
        } else {
            tokenIn.safeTransferFrom(payer, pool, uint256(zeroForOne ? amount0Delta : amount1Delta));
        }
        
        if (ETHOut) {
            uint256 amount = uint256(-(zeroForOne ? amount1Delta : amount0Delta));
            _unwrapETH(amount);
            receiver.safeTransferETH(amount);
        }
    }

    /// @dev ETH receiver fallback
    receive() external payable {
        assembly {
            if iszero(eq(caller(), WETH)) { revert(0, 0) }
        }
    }

    /// ====================== HELPER FUNCTIONS ===================== ///

    /// @dev Previews a `send` command from the parts of a matched intent string
    function _previewSend(bytes memory to, bytes memory amount, bytes memory token)
        internal
        view
        returns (
            address _to,
            uint256 _amount,
            address _token,
            bytes memory callData
        )
    {
        uint256 decimals;
        if (token.length == 42) _token = _toAddress(token);
        else (_token, decimals) = _returnTokenConstants(bytes32(token));
        if (_token == address(0)) _token = addresses[string(token)];
        
        bool isETH = _token == ETH;
        _to = _toAddress(to);
        _amount = _toUint(amount, decimals != 0 ? decimals : _token.readDecimals(), _token);
        
        if (!isETH) callData = abi.encodeCall(IToken.transfer, (_to, _amount));
    }

    /// @dev Previews a `swap` command from the parts of a matched intent string
    function _previewSwap(
        bytes memory amountIn,
        bytes memory amountOutMin,
        bytes memory tokenIn,
        bytes memory tokenOut,
        bytes memory receiver
    )
        internal
        view
        returns (
            uint256 _amountIn,
            uint256 _amountOut,
            address _tokenIn,
            address _tokenOut,
            address _receiver
        )
    {
        uint256 decimalsIn;
        uint256 decimalsOut;
        
        if (tokenIn.length == 42) _tokenIn = _toAddress(tokenIn);
        else (_tokenIn, decimalsIn) = _returnTokenConstants(bytes32(tokenIn));
        if (_tokenIn == address(0)) _tokenIn = addresses[string(tokenIn)];
        
        if (tokenOut.length == 42) _tokenOut = _toAddress(tokenOut);
        else (_tokenOut, decimalsOut) = _returnTokenConstants(bytes32(tokenOut));
        if (_tokenOut == address(0)) _tokenOut = addresses[string(tokenOut)];

        _amountIn = _toUint(amountIn, decimalsIn != 0 ? decimalsIn : _tokenIn.readDecimals(), _tokenIn);
        _amountOut = _toUint(
            amountOutMin, decimalsOut != 0 ? decimalsOut : _tokenOut.readDecimals(), _tokenOut
        );

        if (receiver.length != 0) _receiver = _toAddress(receiver);
    }

    /// @dev Returns the canonical token address constant for a matched intent string
    function _returnTokenConstants(bytes32 token)
        internal
        pure
        returns (address _token, uint256 _decimals)
    {
        if (token == "eth" || token == "ether") return (ETH, 18);
        if (token == "usdc") return (USDC, 6);
        if (token == "usdt" || token == "tether") return (USDT, 6);
        if (token == "dai") return (DAI, 18);
        if (token == "weth") return (WETH, 18);
        if (token == "wbtc" || token == "btc" || token == "bitcoin") return (WBTC, 8);
    }

    /// @dev Computes the create2 address for given token pair
    function _computePoolAddress(address tokenA, address tokenB)
        internal
        view
        returns (address pool, bool zeroForOne)
    {
        if (tokenA < tokenB) zeroForOne = true;
        else (tokenA, tokenB) = (tokenB, tokenA);
        
        // Try common fee tiers
        address pool3000 = _computePairHash(tokenA, tokenB, 3000); // 0.3% fee tier (most common)
        if (pool3000.code.length != 0) return (pool3000, zeroForOne);
        
        address pool500 = _computePairHash(tokenA, tokenB, 500); // 0.05% fee tier
        if (pool500.code.length != 0) return (pool500, zeroForOne);
        
        address pool10000 = _computePairHash(tokenA, tokenB, 10000); // 1% fee tier
        if (pool10000.code.length != 0) return (pool10000, zeroForOne);
        
        address pool100 = _computePairHash(tokenA, tokenB, 100); // 0.01% fee tier
        if (pool100.code.length != 0) return (pool100, zeroForOne);
        
        revert InvalidSwap(); // No valid pool found
    }

    /// @dev Computes the create2 deployment hash for a given token pair
    function _computePairHash(address token0, address token1, uint24 fee)
        internal
        pure
        returns (address pool)
    {
        bytes32 salt = keccak256(abi.encode(token0, token1, fee));
        pool = address(uint160(uint256(keccak256(abi.encodePacked(
            hex'ff',
            UNISWAP_V3_FACTORY,
            salt,
            UNISWAP_V3_POOL_INIT_CODE_HASH
        )))));
    }

    /// @dev Wraps an `amount` of ETH to WETH
    function _wrapETH(uint256 amount) internal {
        (bool success,) = WETH.call{value: amount}("");
        require(success, "ETH wrapping failed");
    }

    /// @dev Unwraps an `amount` of ETH from WETH
    function _unwrapETH(uint256 amount) internal {
        (bool success,) = WETH.call(abi.encodeWithSignature("withdraw(uint256)", amount));
        require(success, "ETH unwrapping failed");
    }

    /// @dev Returns the amount of ERC20 `token` owned by `account`
    function _balanceOf(address token, address account)
        internal
        view
        returns (uint256 amount)
    {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature("balanceOf(address)", account)
        );
        require(success, "Balance check failed");
        amount = abi.decode(data, (uint256));
    }

    /// ===================== STRING OPERATIONS ===================== ///

    /// @dev Returns copy of string in lowercase
    function _lowercase(bytes memory subject) internal pure returns (bytes memory result) {
        result = new bytes(subject.length);
        for (uint i = 0; i < subject.length; i++) {
            // Convert uppercase to lowercase
            if (subject[i] >= 0x41 && subject[i] <= 0x5A) {
                result[i] = bytes1(uint8(subject[i]) + 32);
            } else {
                result[i] = subject[i];
            }
        }
    }

    /// @dev Extracts the first word (action) as bytes32
    function _extraction(bytes memory normalizedIntent)
        internal
        pure
        returns (bytes32 result)
    {
        uint256 len = normalizedIntent.length;
        bytes memory firstWord = new bytes(32);
        uint256 wordLen = 0;
        
        for (uint256 i = 0; i < len && i < 32; i++) {
            if (normalizedIntent[i] == 0x20) break; // Space character
            firstWord[i] = normalizedIntent[i];
            wordLen++;
        }
        
        assembly {
            result := mload(add(firstWord, 32))
        }
    }

    /// @dev Extract the key words of normalized `send` intent
    function _extractSend(bytes memory normalizedIntent)
        internal
        pure
        returns (bytes memory to, bytes memory amount, bytes memory token)
    {
        StringPart[] memory parts = _split(normalizedIntent, " ");
        if (parts.length == 4) {
            // Format: "send 0.1 eth 0x123..."
            return (
                _getPart(normalizedIntent, parts[3]),  // recipient address
                _getPart(normalizedIntent, parts[1]),  // amount
                _getPart(normalizedIntent, parts[2])   // token
            );
        } else {
            revert InvalidSyntax(); // Command is not formatted
        }
    }

    /// @dev Extract the key words of normalized `swap` intent
    function _extractSwap(bytes memory normalizedIntent)
        internal
        pure
        returns (
            bytes memory amountIn,
            bytes memory amountOutMin,
            bytes memory tokenIn,
            bytes memory tokenOut,
            bytes memory receiver
        )
    {
        StringPart[] memory parts = _split(normalizedIntent, " ");
        if (parts.length == 5) {
            // Format: "swap 0.1 weth for dai"
            return (
                _getPart(normalizedIntent, parts[1]),
                "",
                _getPart(normalizedIntent, parts[2]),
                _getPart(normalizedIntent, parts[4]),
                ""
            );
        } else if (parts.length == 7) {
            // Format: "swap 0.1 weth for dai to 0x123"
            return (
                _getPart(normalizedIntent, parts[1]),
                "",
                _getPart(normalizedIntent, parts[2]),
                _getPart(normalizedIntent, parts[4]),
                _getPart(normalizedIntent, parts[6])
            );
        } else {
            revert InvalidSyntax(); // Unformatted
        }
    }

    /// @dev Splits a string into parts based on a delimiter
    function _split(bytes memory base, bytes1 delimiter)
        internal
        pure
        returns (StringPart[] memory parts)
    {
        uint256 len = base.length;
        uint256 count = 1;
        // Count the number of parts
        for (uint256 i = 0; i < len; i++) {
            if (base[i] == delimiter) {
                count++;
            }
        }
        
        parts = new StringPart[](count);
        uint256 partIndex = 0;
        uint256 start = 0;
        
        // Split the string and populate parts array
        for (uint256 i = 0; i < len; i++) {
            if (base[i] == delimiter) {
                parts[partIndex++] = StringPart(start, i);
                start = i + 1;
            }
        }
        
        // Add the final part
        parts[partIndex] = StringPart(start, len);
    }

    /// @dev Converts a `StringPart` into its compact bytes
    function _getPart(bytes memory base, StringPart memory part)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory result = new bytes(part.end - part.start);
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = base[part.start + i];
        }
        return result;
    }

    /// @dev Convert string to address
    function _toAddress(bytes memory s) internal pure returns (address addr) {
        if (s.length == 42) {
            uint256 result = 0;
            for (uint256 i = 2; i < 42; i++) {
                result *= 16;
                uint8 b = uint8(s[i]);
                if (b >= 48 && b <= 57) {
                    result += b - 48;
                } else if (b >= 65 && b <= 70) {
                    result += b - 55;
                } else if (b >= 97 && b <= 102) {
                    result += b - 87;
                } else {
                    revert InvalidSyntax();
                }
            }
            return address(uint160(result));
        } else {
            revert InvalidSyntax();
        }
    }

    /// @dev Convert string to uint256
    function _toUint(bytes memory s, uint256 decimals, address token)
        internal
        view
        returns (uint256 result)
    {
        // Check for "all"
        if (keccak256(s) == keccak256(bytes("all"))) {
            return token == ETH ? msg.sender.balance + msg.value : _balanceOf(token, msg.sender);
        }

        uint256 len = s.length;
        bool hasDecimal = false;
        uint256 decimalPlaces = 0;

        for (uint256 i = 0; i < len; i++) {
            bytes1 c = s[i];
            if (c >= 0x30 && c <= 0x39) {
                result = result * 10 + uint8(c) - 48;
                if (hasDecimal) {
                    decimalPlaces++;
                }
            } else if (c == 0x2E && !hasDecimal) {
                hasDecimal = true;
            } else {
                revert InvalidCharacter();
            }
        }

        // Adjust for decimals
        if (!hasDecimal) {
            result *= 10 ** decimals;
        } else if (decimalPlaces < decimals) {
            result *= 10 ** (decimals - decimalPlaces);
        }
    }
}

interface IToken {
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

interface ISwapRouter {
    function swap(address, bool, int256, uint160, bytes calldata)
        external
        returns (int256, int256);
}
