// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/intent-engines/send-swap-ie.sol";


interface IWETH9 {
    function deposit() external payable;
    function approve(address guy, uint wad) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

interface IERC20 {
    function balanceOf(address owner) external view returns (uint256);
}

contract SimpleIETest is Test {
    SimpleIE public simpleIE;
    IWETH9 constant WETH = IWETH9(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    IERC20 constant DAI = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    address constant USER = address(1);
    uint256 fork;

    function setUp() public {
        // Fork mainnet
        fork = vm.createFork("https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo");
        vm.selectFork(fork);

        // Deploy SimpleIE
        simpleIE = new SimpleIE();

        // Fund USER with ETH and wrap to WETH
        vm.deal(USER, 5 ether);
        vm.startPrank(USER);
        WETH.deposit{value: 5 ether}();
        WETH.approve(address(simpleIE), type(uint256).max);
        vm.stopPrank();
    }

    function testSendWETH() public {
        address receiver = address(2);
        uint256 amount = 0.1 ether;

        // Record receiver balance before sending
        uint256 before = WETH.balanceOf(receiver);

        // Send 0.1 WETH to receiver
        vm.prank(USER);
        simpleIE.command("send 0.1 weth 0x0000000000000000000000000000000000000002");

        // Record balance after sending
        uint256 afterBalance = WETH.balanceOf(receiver);

        // Check the delta equals the sent amount
        assertEq(afterBalance - before, amount);
    }

    function testSwapWETHForDAI() public {
        // Record DAI before swap
        uint256 before = DAI.balanceOf(USER);

        // Perform swap 0.1 WETH for DAI
        vm.prank(USER);
        simpleIE.command("swap 0.1 weth for dai");

        // Verify DAI balance increased
        uint256 afterBalance = DAI.balanceOf(USER);
        assertGt(afterBalance, before);
    }
}
