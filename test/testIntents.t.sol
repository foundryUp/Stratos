// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.17;

// import {Test, console} from "forge-std/Test.sol";
// import {CompoundIntents} from "../src/CompoundIntents.sol";
// import {CompoundETHManager, ICEth} from "../src/CompoundETHManager2.sol";

// contract CompoundIntentsTest is Test {
//     CompoundIntents public intentsEngine;
//     CompoundETHManager public compoundManager;

//     address user = address(1); // Test user address
//     address constant cEthAddress = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5; // Compound cETH address

//     function setUp() public {
//         // Deploy CompoundETHManager and Intents Engine
//         compoundManager = new CompoundETHManager(cEthAddress);
//         intentsEngine = new CompoundIntents(payable(address(compoundManager)), cEthAddress);

//         // Provide test user with initial ETH
//         vm.deal(user, 10 ether);
//     }

//     function testDepositIntent() public {
//         vm.startPrank(user);

//         uint256 depositAmount = 1 ether;

//         // User executes "deposit" command through intents engine
//         intentsEngine.command{value: depositAmount}("deposit 1 ETH");

//         // Validate cETH balance after deposit
//         uint256 userCETHBalance = ICEth(cEthAddress).balanceOf(user);
//         assert(userCETHBalance > 0);

//         vm.stopPrank();
//     }


//     function testWrongDepositIntent() public {
//         vm.startPrank(user);

//         uint256 depositAmount = 1 ether;

//         // User executes "deposit" command through intents engine
//         vm.expectRevert();
//         intentsEngine.command{value: depositAmount}("deposjnc n js 1 ETH");
       

//         vm.stopPrank();
//     }

//     function testWithdrawIntent() public {
//         vm.startPrank(user);

//         uint256 depositAmount = 2 ether;

//         // User deposits ETH first
//         intentsEngine.command{value: depositAmount}("deposit 2 ETH");

//         // Verify cETH balance after deposit
//         uint256 userCETHBalance = ICEth(cEthAddress).balanceOf(user);
//         assert(userCETHBalance > 0);

//         // Transfer cETH to Compound Manager to facilitate withdrawal
//         ICEth(cEthAddress).transfer(address(compoundManager), userCETHBalance);

//         // Get user ETH balance before withdrawal
//         uint256 userBalanceBefore = user.balance;

//         // User withdraws ETH using intents engine
//         intentsEngine.command(
//             string(abi.encodePacked("withdraw ", _toString(userCETHBalance), " ETH"))
//         );

//         // Verify user ETH balance increased after withdrawal
//         uint256 userBalanceAfter = user.balance;
//         assert(userBalanceAfter > userBalanceBefore);

//         vm.stopPrank();
//     }

//     function _toString(uint256 value) internal pure returns (string memory) {
//         if (value == 0) {
//             return "0";
//         }
//         uint256 temp = value;
//         uint256 digits;
//         while (temp != 0) {
//             digits++;
//             temp /= 10;
//         }
//         bytes memory buffer = new bytes(digits);
//         while (value != 0) {
//             digits -= 1;
//             buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
//             value /= 10;
//         }
//         return string(buffer);
//     }
// }
