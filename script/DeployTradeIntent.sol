// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Script} from "forge-std/Script.sol";
// import {IntentEngine} from "src/intent-engines/IntentEngineAlgo.sol";
import {IntentEngine} from "src/intent-engines/IntentEngineDefi.sol";

import {AaveV3Interactor} from "src/aave/aave_core.sol";

contract DeployIntentEngine is Script {
    // function run() external returns (IntentEngine) {
    function run() external returns (AaveV3Interactor,IntentEngine) {

        address compoundManager = 0x0000000000000000000000000000000000000001; // placeholder

        vm.startBroadcast();

        AaveV3Interactor aaveCore = new AaveV3Interactor();
        // IntentEngine engine = new IntentEngine();
        IntentEngine engine = new IntentEngine(compoundManager,address(aaveCore));

        vm.stopBroadcast();

        return (aaveCore,engine);
        // return engine;
    }
}
