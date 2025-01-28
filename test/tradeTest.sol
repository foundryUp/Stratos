// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {IntentEngine} from "../src/IntentEngineTrade.sol";
import {IUniswap} from "../src/IUniswap.sol";
import {IERC20} from "../src/IERC20.sol";

contract TradeTest is Test {
    // Contracts
    IntentEngine intentEngine;
    address constant weth_address = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // WETH on ETH Mainnet

    IUniswap public uniswapRouter;

    // Accounts
    address user = address(1);

    // Fork IDs
    uint256 public ethereumMainnetForkId;

    function setUp() public {
        // Create Forks
        ethereumMainnetForkId = vm.createFork(
            "https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo"
        );

        // Deploy Intent Engine
        vm.selectFork(ethereumMainnetForkId);
        intentEngine = new IntentEngine();
        uniswapRouter = IUniswap(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        console.log("Intent Engine address: ", address(intentEngine));
        console.log("Setup done");
    }

    function testTrade() public {
        vm.selectFork(ethereumMainnetForkId);

        deal(weth_address, user, 10 * 1e18); //10 WETH given to user

        // Fetching user balance
        uint256 userBalance = IERC20(weth_address).balanceOf(user); // WETH BALANCE
        console.log("User balance: ", userBalance); // 10 WETH is coming

        // Fetching intent values
        uint256 amount;
        address  token1;
        address  token2;
        string memory protocol;
        (token1, token2, amount, protocol) = intentEngine.returnIntentValues(
            "weth dai 1.0203232 uniswap"
        );
        console.log("token1: ", token1);
        console.log("token2: ", token2);
        console.log("amount: ", amount);
        console.log("protocol: ", protocol);

        vm.startPrank(user); // Execute the transaction as the user

        require(
            IERC20(weth_address).approve(address(intentEngine), amount),
            "approve failed."
        );
        console.log("Approved Uniswap to spend ", amount);

        vm.stopPrank();

        uint256 allowance = IERC20(weth_address).allowance(
            user,
            address(intentEngine)
        );
        console.log("Allowance given to Intent Engine:", allowance);
        require(amount == allowance, "Allowance not set");

        // checking amounts out
        address[] memory pathArray = new address[](2);
        pathArray[0] = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        pathArray[1] = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

        uint256[] memory amountsOut = IUniswap(
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
        ).getAmountsOut(amount, pathArray);
        //weth to dai!

        address addToken1 = intentEngine.getAddressFromString("weth");
        console.log(
            "Expected DAI output: ",
            amountsOut[1] / 1e18
            // "address of coin output",
            // pathArray[1]
        );
        vm.prank(user);
        intentEngine.commandToTrade("weth dai 1 uniswap");
        console.log("Swapped on Uniswap");

        uint256 userBalanceRemainsAfterTradeFirst = IERC20(weth_address)
            .balanceOf(address(user));
        console.log(
            "User balance remains after trade: ",
            userBalanceRemainsAfterTradeFirst / 1e18
        );

        uint256 userBalanceOfSecondToken = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F)
            .balanceOf(address(user));
        console.log(
            "User balance of second token after trade: ",
            userBalanceOfSecondToken / 1e18
        );
    }
}
