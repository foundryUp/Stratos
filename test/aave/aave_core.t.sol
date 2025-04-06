// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "forge-std/Test.sol";
import "../../src/aave/aave_core.sol";

/// @notice A Foundry test that forks Arbitrum mainnet to test the AaveV3Interactor contract.
contract AaveV3InteractorTest is Test {
    // Aave V3 Pool on Arbitrum mainnet.
    address constant AAVE_POOL = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    // USDC address on Arbitrum (6 decimals).
    address constant USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    // WETH address on Arbitrum.
    address constant WETH = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;

    // In this test the deployer/owner of the interactor is the test contract.
    address user;

    AaveV3Interactor interactor;
    uint256 forkId;

    function setUp() public {
        // Create a fork of Arbitrum mainnet.
        string memory arbRpcUrl = "https://arb-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo";
        forkId = vm.createFork(arbRpcUrl);
        vm.selectFork(forkId);
    
        // Set the test contract as the user (owner) of the interactor.
        user = address(1);

        // Deploy our Aave V3 interactor contract (owner is the deployer).
        interactor = new AaveV3Interactor(AAVE_POOL);
    
        // Fund the owner with ample USDC and WETH.
        deal(USDC, user, 10000 ether);
        deal(WETH, user, 10000 ether);
    }

    function testDepositBorrowRepayWithdraw() public {
        // Define amounts.
        vm.startPrank(user);
        uint256 depositAmountUSDC = 1000000 * 1e6; // 10,000 USDC (USDC has 6 decimals)
        uint256 borrowAmountWETH = 0.0000000000001 * 1e18;       // 1 WETH (WETH has 18 decimals)


        // Approve the interactor to pull USDC from the owner.
        IERC20(USDC).approve(address(interactor), depositAmountUSDC);
        // Deposit USDC collateral into Aave.
        vm.stopPrank();
        interactor.deposit(USDC, depositAmountUSDC,user);

        // Borrow 1 WETH from Aave using the deposited collateral.
        interactor.borrow(WETH, borrowAmountWETH, 2,user);
        vm.startPrank(user);

        // Approve the interactor to pull WETH for repayment.
        IERC20(WETH).approve(address(interactor), borrowAmountWETH);
        // Repay the borrowed 1 WETH.
                vm.stopPrank();

        interactor.repay(WETH, borrowAmountWETH, 2,user);

        // Check USDC balance before withdrawal.
        uint256 usdcBalanceBefore = IERC20(USDC).balanceOf(user);
        // Withdraw the USDC collateral.
        interactor.withdraw(USDC, depositAmountUSDC,user);
        // Check that the USDC balance has increased.
        uint256 usdcBalanceAfter = IERC20(USDC).balanceOf(user);
        assertGe(usdcBalanceAfter, usdcBalanceBefore);
    }
}
