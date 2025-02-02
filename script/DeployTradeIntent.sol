// SPDX-License-Identifier : MIT

pragma solidity ^0.8.17;

import {Script} from "forge-std/Script.sol"; //import Script from Foundry Standard Lib
import  {IntentEngine} from "../src/IntentEngineTrade.sol"; //import contract to deploy
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployTradeIntent is Script {

   function run() external returns(address) {

      address proxy= deployIE();
      return proxy;
   }


   function deployIE() public returns(address) {
      vm.startBroadcast();
      
      IntentEngine intentEngineTrade = new IntentEngine();
  
      bytes memory data = abi.encodeWithSignature("initialize()");
  
      ERC1967Proxy proxy = new ERC1967Proxy(address(intentEngineTrade), data);
  
      vm.stopBroadcast();
  
      return address(proxy);
  }
  

}

