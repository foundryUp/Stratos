// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Test} from "forge-std/Test.sol";
import {CompoundETHManager, ICEth} from "../src/CompoundETHManager2.sol";



contract CompoundETHManagerTest is Test {
    CompoundETHManager public compoundManager;
    address user = address(1); // Test user
    address constant cEthAddress = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

    function setUp() public {
        compoundManager = new CompoundETHManager(cEthAddress);
        vm.deal(user, 10 ether); // Provide ETH to the test user
    }

    function testDepositETH() public {
        vm.startPrank(user);

        uint256 initialCEthBalance = ICEth(cEthAddress).balanceOf(user);
        uint256 depositAmount = 1 ether;

        // Deposit ETH
        compoundManager.depositETH{value: depositAmount}();

        // Verify cETH balance increased
        uint256 finalCEthBalance = ICEth(cEthAddress).balanceOf(user);
        assert(finalCEthBalance > initialCEthBalance);

        vm.stopPrank();
    }

    function testWithdrawETH() public {
        vm.startPrank(user);

        uint256 depositAmount = 1 ether;

        // Deposit ETH
        compoundManager.depositETH{value: depositAmount}();

        uint256 cEthBalance = ICEth(cEthAddress).balanceOf(user);
        assert(cEthBalance > 0);

        // Transfer cETH to contract for withdrawal
        ICEth(cEthAddress).transfer(address(compoundManager), cEthBalance);


        // Withdraw ETH
        uint256 userBalanceBefore = user.balance;
        compoundManager.withdrawETH(cEthBalance);
        uint256 userBalanceAfter = user.balance;

        assert(userBalanceAfter > userBalanceBefore);

        vm.stopPrank();
    }

    function testExchangeRate() public {
        uint256 exchangeRate = compoundManager.getExchangeRate();
        assert(exchangeRate > 0); // Validate that an exchange rate is returned
    }
}
