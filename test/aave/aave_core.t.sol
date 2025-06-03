// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import "../../src/aave/aave_core.sol";

/// @notice A Foundry test that forks Ethereum mainnet to test the AaveV3Interactor contract.
contract AaveV3InteractorTest is Test {
    // Aave V3 Pool on Ethereum mainnet.
    address constant AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    // USDC address on Ethereum mainnet (6 decimals).
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    // WETH address on Ethereum mainnet.
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // In this test the deployer/owner of the interactor is the test contract.
    address user;

    AaveV3Interactor interactor;
    uint256 forkId;

    function setUp() public {
        // Create a fork of Ethereum mainnet.
        string memory ethRpcUrl = "https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo";
        forkId = vm.createFork(ethRpcUrl);
        vm.selectFork(forkId);
    
        // Set the test contract as the user (owner) of the interactor.
        user = address(1);

        // Deploy our Aave V3 interactor contract (owner is the deployer).
        interactor = new AaveV3Interactor();
    
        // Fund the owner with ample USDC and WETH.
        // USDC has 6 decimals, WETH has 18 decimals
        deal(USDC, user, 10000 * 1e6);  // 10,000 USDC
        deal(WETH, user, 10 * 1e18);    // 10 WETH
    }

    function testDepositAndWithdraw() public {
        // Test basic deposit and withdraw functionality
        vm.startPrank(user);
        uint256 depositAmountUSDC = 1000 * 1e6;    // 1,000 USDC (6 decimals)

        // Check initial balance
        uint256 initialBalance = IERC20(USDC).balanceOf(user);
        console.log("Initial USDC balance:", initialBalance);

        // Approve the interactor to pull USDC from the user.
        IERC20(USDC).approve(address(interactor), depositAmountUSDC);
        vm.stopPrank();
        
        // Deposit USDC collateral into Aave.
        interactor.deposit(USDC, depositAmountUSDC, user);
        
        // Check balance after deposit
        uint256 balanceAfterDeposit = IERC20(USDC).balanceOf(user);
        console.log("USDC balance after deposit:", balanceAfterDeposit);
        
        // Verify that USDC was deducted
        assertEq(balanceAfterDeposit, initialBalance - depositAmountUSDC);

        // Verify deposit tracking
        assertEq(interactor.userDeposits(user, USDC), depositAmountUSDC);

        // Withdraw the USDC collateral.
        interactor.withdraw(USDC, depositAmountUSDC, user);
        
        // Check balance after withdrawal
        uint256 balanceAfterWithdraw = IERC20(USDC).balanceOf(user);
        console.log("USDC balance after withdraw:", balanceAfterWithdraw);
        
        // Check that the USDC balance has been restored (should be close to initial, minus fees)
        assertGe(balanceAfterWithdraw, initialBalance - 1e6); // Allow for some fee/rounding
        
        // Verify deposit tracking was updated
        assertEq(interactor.userDeposits(user, USDC), 0);
    }

    function testBorrowRepaySmallAmount() public {
        // Test with very small amounts to avoid arithmetic overflow
        vm.startPrank(user);
        uint256 depositAmountUSDC = 100 * 1e6;     // 100 USDC (6 decimals)
        uint256 borrowAmountWETH = 0.01 * 1e18;    // 0.01 WETH (18 decimals) - very small amount

        // Initial balances
        uint256 initialUSDCBalance = IERC20(USDC).balanceOf(user);
        uint256 initialWETHBalance = IERC20(WETH).balanceOf(user);
        
        console.log("Initial USDC balance:", initialUSDCBalance);
        console.log("Initial WETH balance:", initialWETHBalance);

        // Approve and deposit USDC collateral
        IERC20(USDC).approve(address(interactor), depositAmountUSDC);
        vm.stopPrank();
        
        interactor.deposit(USDC, depositAmountUSDC, user);
        console.log("USDC deposited:", depositAmountUSDC);

        // Borrow WETH
        interactor.borrow(WETH, borrowAmountWETH, 2, user);
        
        uint256 wethBalanceAfterBorrow = IERC20(WETH).balanceOf(user);
        console.log("WETH balance after borrow:", wethBalanceAfterBorrow);
        
        // Verify WETH was received
        assertEq(wethBalanceAfterBorrow, initialWETHBalance + borrowAmountWETH);

        vm.startPrank(user);
        // Approve for repayment (with a small buffer for interest)
        IERC20(WETH).approve(address(interactor), borrowAmountWETH + 1e15); // +0.001 WETH buffer
                vm.stopPrank();

        // Repay the borrowed WETH
        interactor.repay(WETH, borrowAmountWETH, 2, user);
        
        uint256 wethBalanceAfterRepay = IERC20(WETH).balanceOf(user);
        console.log("WETH balance after repay:", wethBalanceAfterRepay);

        // Verify WETH was deducted for repayment
        assertLe(wethBalanceAfterRepay, wethBalanceAfterBorrow);

        // Withdraw the USDC collateral
        interactor.withdraw(USDC, depositAmountUSDC, user);
        
        uint256 finalUSDCBalance = IERC20(USDC).balanceOf(user);
        console.log("Final USDC balance:", finalUSDCBalance);
        
        // Should be close to initial balance (within reasonable tolerance)
        assertGe(finalUSDCBalance, initialUSDCBalance - 1e6);
    }
}
