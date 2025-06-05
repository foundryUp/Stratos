// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TradingEngine} from "src/intent-engines/TradingEngine.sol";
import {AaveV3Interactor} from "src/aave/aave_core.sol";
import {SimpleIE} from "src/intent-engines/send-swap-ie.sol";

contract DeployAll is Script {
    function run() external returns (TradingEngine, AaveV3Interactor, SimpleIE) {
        vm.startBroadcast();
        
        // Deploy TradingEngine (for Trading Assistant)
        console.log("Deploying TradingEngine...");
        TradingEngine tradingEngine = new TradingEngine();
        console.log("TradingEngine deployed at:", address(tradingEngine));
        
        // Deploy AaveV3Interactor (for DeFi Assistant)
        console.log("Deploying AaveV3Interactor...");
        AaveV3Interactor aaveInteractor = new AaveV3Interactor();
        console.log("AaveV3Interactor deployed at:", address(aaveInteractor));
        console.log("AaveV3Interactor owner:", aaveInteractor.owner());
        console.log("Aave Pool address:", address(aaveInteractor.pool()));
        
        // Deploy SimpleIE (for General Assistant)
        console.log("Deploying SimpleIE...");
        SimpleIE simpleIE = new SimpleIE();
        console.log("SimpleIE deployed at:", address(simpleIE));
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("TradingEngine (Trading Assistant):", address(tradingEngine));
        console.log("AaveV3Interactor (DeFi Assistant):", address(aaveInteractor));
        console.log("SimpleIE (General Assistant):", address(simpleIE));
        console.log("\nUpdate these addresses in frontend/src/constants/abi.js");
        
        return (tradingEngine, aaveInteractor, simpleIE);
    }
} 