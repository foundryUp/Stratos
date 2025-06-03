// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

// Minimal ERC20 interface for token transfers and approvals.
interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

// Minimal Aave V3 Pool interface with key functions.
interface IPool {
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);

    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode, // 1 for stable, 2 for variable
        uint16 referralCode,
        address onBehalfOf
    ) external;

    function repay(
        address asset,
        uint256 amount,
        uint256 rateMode, // 1 for stable, 2 for variable
        address onBehalfOf
    ) external returns (uint256);
}

/// @title AaveV3Interactor
/// @notice This contract provides functions to interact with the Aave V3 Pool.
/// It allows users to deposit collateral, borrow assets, repay loans, and withdraw collateral.
/// The contract acts as a vault, holding aTokens on behalf of users.
contract AaveV3Interactor {
    IPool public pool;
    address public owner;
    
    // Track user deposits for proper accounting
    mapping(address => mapping(address => uint256)) public userDeposits;
    
    constructor() {
        pool = IPool(0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2);
        owner = msg.sender;
    }

    /// @notice Deposits an ERC20 token into the Aave Pool as collateral.
    /// @param asset The address of the ERC20 token.
    /// @param amount The amount of tokens to deposit.
    /// @param user The user on whose behalf to track the deposit.
    function deposit(address asset, uint256 amount, address user) external {
        // Transfer tokens from the user to this contract.
        require(IERC20(asset).transferFrom(user, address(this), amount), "Transfer failed");
        // Approve the Aave pool to pull the tokens.
        require(IERC20(asset).approve(address(pool), amount), "Approve failed");
        // Deposit tokens into the Aave pool on behalf of this contract (so contract gets aTokens).
        pool.deposit(asset, amount, address(this), 0);
        
        // Track the user's deposit
        userDeposits[user][asset] += amount;
    }

    /// @notice Borrows an ERC20 token from the Aave Pool.
    /// @param asset The address of the ERC20 token to borrow.
    /// @param amount The amount of tokens to borrow.
    /// @param interestRateMode The interest rate mode (1 for stable, 2 for variable).
    /// @param user The user on whose behalf to borrow.
    function borrow(address asset, uint256 amount, uint256 interestRateMode, address user) external  {
        pool.borrow(asset, amount, interestRateMode, 0, address(this));
        // Transfer borrowed tokens to the user
        require(IERC20(asset).transfer(user, amount), "Transfer failed");
    }

    /// @notice Repays a borrowed ERC20 token to the Aave Pool.
    /// @param asset The address of the ERC20 token to repay.
    /// @param amount The amount to repay.
    /// @param rateMode The interest rate mode of the debt (1 for stable, 2 for variable).
    /// @param user The user on whose behalf to repay.
    function repay(address asset, uint256 amount, uint256 rateMode, address user) external  {
        // Transfer tokens from the user to this contract for repayment.
        require(IERC20(asset).transferFrom(user, address(this), amount), "Transfer failed");
        // Approve the Aave pool to pull the tokens for repayment.
        require(IERC20(asset).approve(address(pool), amount), "Approve failed");
        pool.repay(asset, amount, rateMode, address(this));
    }
    
    /// @notice Withdraws collateral from the Aave Pool.
    /// @param asset The address of the ERC20 token to withdraw.
    /// @param amount The amount of tokens to withdraw.
    /// @param user The user to whom to send the withdrawn tokens.
    function withdraw(address asset, uint256 amount, address user) external  {
        // Ensure user has sufficient deposits tracked
        require(userDeposits[user][asset] >= amount, "Insufficient deposit balance");
        
        // Withdraw from Aave pool to the user
        uint256 withdrawnAmount = pool.withdraw(asset, amount, user);
        
        // Update user's deposit tracking
        userDeposits[user][asset] -= amount;
        
        // Return the actual withdrawn amount (unused variable warning fix)
        require(withdrawnAmount > 0, "Withdrawal failed");
    }
}
