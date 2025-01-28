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

//forge script script/DeployTradeIntent.sol:DeployTradeIntent --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
//anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo
