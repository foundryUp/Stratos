// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC20} from "src/interfaces/IERC20.sol";
import {ReentrancyGuard} from "lib/solady/src/utils/ReentrancyGuard.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);
}

contract TradingEngine is ReentrancyGuard {
    
    // Events
    event TradeExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        string tradeType
    );

    // Constants
    address public constant UNISWAP_V2_ROUTER = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // Fixed USDC mainnet address
    
    // Token registry for supported tokens
    mapping(string => address) public tokenRegistry;
    
    // Errors
    error UnsupportedToken();
    error InvalidAmount();
    error SlippageTooHigh();
    error TransferFailed();

    constructor() {
        // Initialize supported tokens
        tokenRegistry["WETH"] = WETH;
        tokenRegistry["USDC"] = USDC;
        tokenRegistry["WBTC"] = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
        tokenRegistry["DAI"] = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    }

    /**
     * @dev Execute a buy trade (USDC -> Token)
     * @param tokenSymbol Symbol of the token to buy
     * @param amountIn Amount of USDC to spend (6 decimals)
     * @param minAmountOut Minimum amount of tokens to receive (slippage protection)
     */
    function buyToken(
        string calldata tokenSymbol,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant {
        if (amountIn == 0) revert InvalidAmount();
        
        address tokenOut = tokenRegistry[tokenSymbol];
        if (tokenOut == address(0)) revert UnsupportedToken();
        if (tokenOut == USDC) revert UnsupportedToken(); // Can't buy USDC with USDC
        
        // Transfer USDC from user
        IERC20 usdcContract = IERC20(USDC);
        require(usdcContract.transferFrom(msg.sender, address(this), amountIn), "USDC transfer failed");
        
        // Approve Uniswap router
        require(usdcContract.approve(UNISWAP_V2_ROUTER, amountIn), "USDC approval failed");
        
        // Setup swap path: USDC -> WETH -> Token (for non-WETH tokens)
        address[] memory path;
        if (tokenOut == WETH) {
            // Direct USDC -> WETH swap
            path = new address[](2);
            path[0] = USDC;
            path[1] = WETH;
        } else {
            // USDC -> WETH -> Token swap
            path = new address[](3);
            path[0] = USDC;
            path[1] = WETH;
            path[2] = tokenOut;
        }
        
        // Execute swap
        uint[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER)
            .swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                path,
                msg.sender,
                block.timestamp + 300 // 5 minute deadline
            );
        
        emit TradeExecuted(
            msg.sender,
            USDC,
            tokenOut,
            amountIn,
            amounts[amounts.length - 1],
            "BUY"
        );
    }

    /**
     * @dev Execute a sell trade (Token -> USDC)
     * @param tokenSymbol Symbol of the token to sell
     * @param amountIn Amount of tokens to sell
     * @param minAmountOut Minimum amount of USDC to receive (slippage protection)
     */
    function sellToken(
        string calldata tokenSymbol,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant {
        if (amountIn == 0) revert InvalidAmount();
        
        address tokenIn = tokenRegistry[tokenSymbol];
        if (tokenIn == address(0)) revert UnsupportedToken();
        if (tokenIn == USDC) revert UnsupportedToken(); // Can't sell USDC for USDC
        
        // Transfer token from user
        IERC20 tokenContract = IERC20(tokenIn);
        require(tokenContract.transferFrom(msg.sender, address(this), amountIn), "Token transfer failed");
        
        // Approve Uniswap router
        require(tokenContract.approve(UNISWAP_V2_ROUTER, amountIn), "Token approval failed");
        
        // Setup swap path: Token -> WETH -> USDC (for non-WETH tokens)
        address[] memory path;
        if (tokenIn == WETH) {
            // Direct WETH -> USDC swap
            path = new address[](2);
            path[0] = WETH;
            path[1] = USDC;
        } else {
            // Token -> WETH -> USDC swap
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = WETH;
            path[2] = USDC;
        }
        
        // Execute swap
        uint[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER)
            .swapExactTokensForTokens(
                amountIn,
                minAmountOut,
                path,
                msg.sender,
                block.timestamp + 300 // 5 minute deadline
            );
        
        emit TradeExecuted(
            msg.sender,
            tokenIn,
            USDC,
            amountIn,
            amounts[amounts.length - 1],
            "SELL"
        );
    }

    /**
     * @dev Get expected output amount for a trade
     * @param tokenSymbol Symbol of the token
     * @param amountIn Input amount
     * @param isBuy True for buy (USDC->Token), false for sell (Token->USDC)
     */
    function getExpectedOutput(
        string calldata tokenSymbol,
        uint256 amountIn,
        bool isBuy
    ) external view returns (uint256) {
        address token = tokenRegistry[tokenSymbol];
        if (token == address(0)) revert UnsupportedToken();
        
        address[] memory path;
        if (isBuy) {
            // Buying: USDC -> Token
            if (token == WETH) {
                path = new address[](2);
                path[0] = USDC;
                path[1] = WETH;
            } else {
                path = new address[](3);
                path[0] = USDC;
                path[1] = WETH;
                path[2] = token;
            }
        } else {
            // Selling: Token -> USDC
            if (token == WETH) {
                path = new address[](2);
                path[0] = WETH;
                path[1] = USDC;
            } else {
                path = new address[](3);
                path[0] = token;
                path[1] = WETH;
                path[2] = USDC;
            }
        }
        
        uint[] memory amounts = IUniswapV2Router(UNISWAP_V2_ROUTER)
            .getAmountsOut(amountIn, path);
        
        return amounts[amounts.length - 1];
    }

    /**
     * @dev Add or update a token in the registry (for future extensibility)
     * Note: In production, this should have access control
     */
    function updateTokenRegistry(string calldata symbol, address tokenAddress) external {
        tokenRegistry[symbol] = tokenAddress;
    }

    /**
     * @dev Get token address by symbol
     */
    function getTokenAddress(string calldata symbol) external view returns (address) {
        return tokenRegistry[symbol];
    }

    /**
     * @dev Emergency function to recover stuck tokens
     * Note: In production, this should have access control
     */
    function emergencyWithdraw(address token, uint256 amount) external {
        require(IERC20(token).transfer(msg.sender, amount), "Emergency withdraw failed");
    }
} 