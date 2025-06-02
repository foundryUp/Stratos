// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Script} from "forge-std/Script.sol";
import {SimpleIE} from "src/intent-engines/send-swap-ie.sol";


contract DeployIntentEngine is Script {
    function run() external returns (SimpleIE) {


        vm.startBroadcast();


        SimpleIE engine = new SimpleIE();

        vm.stopBroadcast();

        return (engine);
    }
}
