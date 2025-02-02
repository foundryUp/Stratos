// SPDX-License-Identifier : MIT

pragma solidity ^0.8.17;

import {Script} from "forge-std/Script.sol"; //import Script from Foundry Standard Lib
import  {IntentEngine} from "../src/IntentEngineTrade.sol"; //import contract to deploy

contract DeployTradeIntent is Script {

   function run() external returns(IntentEngine) {

      vm.startBroadcast();

      IntentEngine intentEngineTrade = new IntentEngine(); 
    
      
      vm.stopBroadcast();

      return intentEngineTrade;

   }

}

