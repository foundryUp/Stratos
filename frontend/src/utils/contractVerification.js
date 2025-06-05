import Web3 from "web3";
import {
  TradingEngineABI,
  TradingEngineAddress,
  AAVE_ABI,
  AAVE_Interactor_Contract,
  SEND_SWAP_CONTRACT,
} from "../constants/abi";
import SimpleIEABI from "../abi/SimpleIE.json";

/**
 * Verify that all contracts are properly deployed and accessible
 */
export async function verifyContracts() {
  try {
    // Use remote Anvil URL for production, fallback to local for development
    const rpcUrl = process.env.REACT_APP_ANVIL_RPC_URL || "https://anvil-mainnet-fork.onrender.com" || "http://localhost:8545";
    const web3 = new Web3(window.ethereum || rpcUrl);
    
    console.log("🔍 Verifying contract deployments...");
    console.log("🌐 Using RPC URL:", rpcUrl);
    
    // 1. Verify TradingEngine
    console.log("📊 Checking TradingEngine at:", TradingEngineAddress);
    const tradingContract = new web3.eth.Contract(TradingEngineABI, TradingEngineAddress);
    
    try {
      const usdcAddress = await tradingContract.methods.USDC().call();
      console.log("✅ TradingEngine USDC address:", usdcAddress);
      
      const wethAddress = await tradingContract.methods.WETH().call();
      console.log("✅ TradingEngine WETH address:", wethAddress);
      
      // Test getTokenAddress function
      const wethFromRegistry = await tradingContract.methods.getTokenAddress("WETH").call();
      console.log("✅ TradingEngine getTokenAddress('WETH'):", wethFromRegistry);
      
    } catch (error) {
      console.error("❌ TradingEngine verification failed:", error);
      return { tradingEngine: false, error: error.message };
    }
    
    // 2. Verify AaveV3Interactor
    console.log("🏦 Checking AaveV3Interactor at:", AAVE_Interactor_Contract);
    const aaveContract = new web3.eth.Contract(AAVE_ABI, AAVE_Interactor_Contract);
    
    try {
      const owner = await aaveContract.methods.owner().call();
      console.log("✅ AaveV3Interactor owner:", owner);
      
      const poolAddress = await aaveContract.methods.pool().call();
      console.log("✅ AaveV3Interactor pool address:", poolAddress);
      
    } catch (error) {
      console.error("❌ AaveV3Interactor verification failed:", error);
      return { aaveInteractor: false, error: error.message };
    }
    
    // 3. Verify SimpleIE
    console.log("🔄 Checking SimpleIE at:", SEND_SWAP_CONTRACT);
    const simpleIEContract = new web3.eth.Contract(SimpleIEABI, SEND_SWAP_CONTRACT);
    
    try {
      // Test if contract exists by checking code
      const code = await web3.eth.getCode(SEND_SWAP_CONTRACT);
      if (code === "0x") {
        throw new Error("No contract code found at address");
      }
      console.log("✅ SimpleIE contract code exists");
      
      // Try to call a view function if available
      // Note: SimpleIE might not have view functions, so we just check if it exists
      
    } catch (error) {
      console.error("❌ SimpleIE verification failed:", error);
      return { simpleIE: false, error: error.message };
    }
    
    console.log("🎉 All contracts verified successfully!");
    return {
      tradingEngine: true,
      aaveInteractor: true,
      simpleIE: true,
      success: true
    };
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Test a simple trading operation to verify functionality
 */
export async function testTradingContract(account) {
  try {
    const rpcUrl = process.env.REACT_APP_ANVIL_RPC_URL || "https://anvil-mainnet-fork.onrender.com" || "http://localhost:8545";
    const web3 = new Web3(window.ethereum || rpcUrl);
    const tradingContract = new web3.eth.Contract(TradingEngineABI, TradingEngineAddress);
    
    console.log("🧪 Testing TradingEngine functionality...");
    
    // Test getExpectedOutput with small amount
    const testAmount = web3.utils.toWei("1", "mwei"); // 1 USDC
    const expectedOutput = await tradingContract.methods
      .getExpectedOutput("WETH", testAmount, true) // true for buy
      .call();
    
    console.log("✅ getExpectedOutput test successful:", expectedOutput);
    return { success: true, expectedOutput };
    
  } catch (error) {
    console.error("❌ Trading contract test failed:", error);
    return { success: false, error: error.message };
  }
} 