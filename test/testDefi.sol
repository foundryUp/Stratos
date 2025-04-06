// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test,console} from "forge-std/Test.sol";
import {IntentEngine} from "src/intent-engines/IntentEngineDefi.sol";
import {AaveV3Interactor} from "src/aave/aave_core.sol";
import {IERC20} from "src/interfaces/IERC20.sol";

interface IWETH {
    function deposit() external payable;
}

contract TestDefi is Test {
    uint256 public ethereumMainnetForkId;
    IntentEngine public intentEngine;
    AaveV3Interactor public aavev3int;
    address public compoundManager = address(1);
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    function setUp() public {
        // 1) fork mainnet
        ethereumMainnetForkId = vm.createFork(
            "https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo"
        );
        vm.selectFork(ethereumMainnetForkId);

        // 2) deploy interactor & engine
        aavev3int   = new AaveV3Interactor();
        intentEngine = new IntentEngine(compoundManager, address(aavev3int));
    }

    function testValidDeposit() public {
        // pick a test user
        address user = address(0xABCD);

        // give them 3 ETH
        vm.deal(user, 3 ether);

        // wrap 3 ETH → 3 WETH
        vm.prank(user);
        IWETH(WETH).deposit{ value: 3 ether }();
        console.log("user balance before weth ",IERC20(WETH).balanceOf(user));

        // approve 1 WETH to the Aave interactor
        vm.prank(user);
        IERC20(WETH).approve(address(aavev3int), 1 ether);
        vm.prank(user);
        (uint256 amount, string memory protocol) = intentEngine.commandToTrade("deposit weth 1 aave");
    }
}
