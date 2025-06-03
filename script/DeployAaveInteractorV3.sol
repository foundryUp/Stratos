// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "forge-std/Script.sol";
import "../src/aave/aave_core.sol";

contract DeployAaveInteractorV3 is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy the AaveV3Interactor contract
        AaveV3Interactor interactor = new AaveV3Interactor();

        // Log the deployed contract address
        console.log("AaveV3Interactor deployed at:", address(interactor));
        console.log("Owner set to:", interactor.owner());
        console.log("Aave Pool address:", address(interactor.pool()));

        // Stop broadcasting
        vm.stopBroadcast();
    }
} 