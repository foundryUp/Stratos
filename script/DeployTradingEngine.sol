// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TradingEngine} from "src/intent-engines/TradingEngine.sol";

contract DeployTradingEngine is Script {
    function run() external returns (TradingEngine) {
        vm.startBroadcast();
        TradingEngine engine = new TradingEngine();
        vm.stopBroadcast();
        
        // Log the deployed address
        console.log("TradingEngine deployed at:", address(engine));
        
        return engine;
    }
} 