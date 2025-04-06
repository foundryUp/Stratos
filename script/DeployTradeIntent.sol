// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Script} from "forge-std/Script.sol";
import {IntentEngine} from "src/intent-engines/IntentEngineAlgo.sol";
import {AaveV3Interactor} from "src/aave/aave_core.sol";

contract DeployIntentEngine is Script {
    function run() external returns (IntentEngine) {
        address compoundManager = 0x0000000000000000000000000000000000000001; // placeholder

        vm.startBroadcast();

        // AaveV3Interactor aaveCore = new AaveV3Interactor();
        IntentEngine engine = new IntentEngine();

        vm.stopBroadcast();

        // return (aaveCore,engine);
        return engine;
    }
}
