import Web3 from "web3";
import {
  TradeABI,
  TradeContractAddress,
  ERC20ABI,
  AAVE_Interactor_Contract,
  AAVE_ABI,
  SEND_SWAP_CONTRACT,
} from "../constants/abi";
import SimpleIEABI from "../abi/SimpleIE.json";

let web3;
let currentAccount = "";

// Token addresses mapping - for General Assistant (native ETH support)
const TOKEN_ADDRESSES = {
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC for trading pairs
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Placeholder for native ETH
};

// Token addresses mapping - for DeFi Assistant (Aave only supports ERC20)
const AAVE_TOKEN_ADDRESSES = {
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // ETH maps to WETH for Aave
};

/**
 * Connects to MetaMask (or any window.ethereum wallet) and returns { web3, account }
 */
export async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      web3 = new Web3(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      currentAccount = accounts[0];
      console.log("Wallet connected, account:", currentAccount);
      return { web3, account: currentAccount };
    } catch (error) {
      console.error("User denied account access");
      throw error;
    }
  } else {
    throw new Error("Please install MetaMask!");
  }
}

/**
 * Fetch token balances for a given account.
 */
export async function fetchTokenBalances(account) {
  if (!web3 || !account) {
    throw new Error("Web3 or account not initialized");
  }
  
  const balancesObj = {};
  try {
    for (const [token, address] of Object.entries(TOKEN_ADDRESSES)) {
      if (token === "ETH") continue; // Skip ETH placeholder
      
      const tokenContract = new web3.eth.Contract(ERC20ABI, address);
      console.log(`Fetching ${token} balance from ${address}...`);
      const balance = await tokenContract.methods.balanceOf(account).call();
      console.log(`${token} raw balance:`, balance);
      
      // Handle different decimal places
      if (token === "USDC" || token === "USDT") {
        // USDC and USDT have 6 decimals
        balancesObj[token] = web3.utils.fromWei(balance, "mwei");
      } else if (token === "WBTC") {
        // WBTC has 8 decimals
        balancesObj[token] = (parseFloat(balance) / Math.pow(10, 8)).toString();
      } else {
        // Most tokens (WETH, DAI) have 18 decimals
        balancesObj[token] = web3.utils.fromWei(balance, "ether");
      }
    }
    console.log("User Token Balances:", balancesObj);
    return balancesObj;
  } catch (error) {
    console.error("Error fetching balances:", error);
    throw error;
  }
}

/**
 * Trading Assistant Functions - Used by TradingChatRSIAlgos.jsx
 */

/**
 * Sends command to the trade contract - used by Trading Assistant
 */
export async function commandToTradeStart(aiResponse) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }
  const tradeContract = new web3.eth.Contract(TradeABI, TradeContractAddress);
  try {
    const tradeTx = await tradeContract.methods
      .commandToTrade(aiResponse)
      .send({ from: currentAccount });
    console.log("Trade Transaction Hash:", tradeTx.transactionHash);
    return tradeTx;
  } catch (error) {
    console.error("Error executing trade command:", error);
    throw error;
  }
}

/**
 * Approves token transfer for trading - used by Trading Assistant
 */
export async function handleTokensApproveTrading(amountToTrade, tokenAddress) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }
  
  const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
  
  try {
    const balance = await tokenContract.methods.balanceOf(currentAccount).call();
    console.log("Token balance:", balance);
    
    // Make sure amountToTrade is a number, not already in wei
    const amountInWei = web3.utils.toWei(amountToTrade.toString(), "ether");
    console.log("Amount to trade in wei:", amountInWei);
    console.log("Approving tokens...");
    
    // Use the correct amount for approval
    const approveTx = await tokenContract.methods
      .approve(TradeContractAddress, amountInWei)
      .send({ from: currentAccount });
      
    console.log("Tokens approved. Tx:", approveTx);
    return true;
  } catch (error) {
    console.error("Error approving tokens:", error);
    throw error;
  }
}

/**
 * General Assistant Functions
 */

/**
 * Executes send/swap commands via SimpleIE contract - used by General Assistant
 */
export async function commandToSimpleIE(commandFromLLM) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }

  try {
    console.log("🟢 General Assistant - RAW Command from LLM:", commandFromLLM);
    console.log("🟢 General Assistant - Command type:", typeof commandFromLLM);
    console.log("🟢 General Assistant - Command length:", commandFromLLM.length);
    
    // 1. Normalize the command (lowercase and clean spaces)
    const command = commandFromLLM.toLowerCase().trim().replace(/\s+/g, ' ');
    const parts = command.split(" ");
    
    console.log("🟢 General Assistant - Normalized command:", JSON.stringify(command));
    console.log("🟢 General Assistant - Parsed parts:", parts);
    console.log("🟢 General Assistant - Number of parts:", parts.length);
    
    // Log each part individually
    parts.forEach((part, index) => {
      console.log(`🟢 General Assistant - Part ${index}:`, JSON.stringify(part), "Length:", part.length);
    });
    
    // Check if this is a send command
    if (parts[0] === "send") {
      console.log("🟢 General Assistant - SEND COMMAND DETECTED");
      console.log("🟢 General Assistant - Amount:", parts[1]);
      console.log("🟢 General Assistant - Token:", parts[2]);
      console.log("🟢 General Assistant - Recipient:", parts[3]);
      
      if (!parts[3]) {
        console.error("🟢 General Assistant - ❌ MISSING RECIPIENT ADDRESS!");
        throw new Error("Missing recipient address in send command");
      }
      
      // Validate recipient address format
      if (parts[3].length !== 42 || !parts[3].startsWith('0x')) {
        console.error("🟢 General Assistant - ❌ INVALID RECIPIENT ADDRESS FORMAT:", parts[3]);
        throw new Error(`Invalid recipient address format: ${parts[3]}`);
      }
    }
    
    // 2. Handle token approvals for swaps (non-ETH only)
    if (parts[0] === "swap") {
      const amountEth = parts[1];
      const tokenSymbol = parts[2];

      // Skip approval if using ETH as input
      if (tokenSymbol !== "eth" && tokenSymbol !== "ether") {
        // Standard token addresses on ETH mainnet
        const TOKEN_ADDRESSES_SWAP = {
          "weth": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",  // Wrapped Ether
          "dai": "0x6B175474E89094C44Da98b954EedeAC495271d0F",   // Dai Stablecoin
          "usdc": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",  // USD Coin
          "usdt": "0xdAC17F958D2ee523a2206206994597C13D831ec7",   // Tether USD
          "wbtc": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",  // Wrapped Bitcoin
          "uni": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",   // Uniswap
          "link": "0x514910771AF9Ca656af840dff83E8264EcF986CA",  // Chainlink
          "matic": "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", // Polygon (MATIC)
          "aave": "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",  // Aave
          "mkr": "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2"    // Maker
        };

        const tokenAddress = TOKEN_ADDRESSES_SWAP[tokenSymbol];
        if (!tokenAddress) {
          throw new Error(`Unsupported token symbol: ${tokenSymbol}. Supported tokens: ${Object.keys(TOKEN_ADDRESSES_SWAP).join(", ")}`);
        }

        // Handle decimals for USDC and USDT (6 decimals) vs others (18 decimals)
        const isDecimal6Token = tokenSymbol === "usdc" || tokenSymbol === "usdt";
        const amountToApprove = isDecimal6Token ? 
          web3.utils.toWei(amountEth, "mwei") :  // 6 decimals
          web3.utils.toWei(amountEth, "ether");  // 18 decimals
        
        console.log(`🟢 General Assistant - Approving ${amountEth} ${tokenSymbol.toUpperCase()} for SimpleIE contract...`);
        const token = new web3.eth.Contract(ERC20ABI, tokenAddress);
        
        try {
          await token.methods
            .approve(SEND_SWAP_CONTRACT, amountToApprove)
            .send({ from: currentAccount });
          console.log(`🟢 General Assistant - ✅ ${tokenSymbol.toUpperCase()} approval successful`);
        } catch (approvalError) {
          console.error(`🟢 General Assistant - Failed to approve ${tokenSymbol.toUpperCase()}:`, approvalError);
          throw new Error(`${tokenSymbol.toUpperCase()} approval failed: ${approvalError.message}`);
        }
      }
    }

    // 3. Execute the command using the correct SimpleIE ABI
    console.log("🟢 General Assistant - FINAL COMMAND TO SEND TO CONTRACT:", JSON.stringify(command));
    const simpleIE = new web3.eth.Contract(SimpleIEABI, SEND_SWAP_CONTRACT);
    
    // Set value for ETH sends/swaps
    let value = "0";
    if (parts[0] === "send" && parts[2] === "eth") {
      value = web3.utils.toWei(parts[1], "ether");
      console.log("🟢 General Assistant - ETH send detected, setting value:", value);
      console.log("🟢 General Assistant - Expected recipient from command:", parts[3]);
    } else if (parts[0] === "swap" && parts[2] === "eth") {
      value = web3.utils.toWei(parts[1], "ether");
      console.log("🟢 General Assistant - ETH swap detected, setting value:", value);
    }
    
    console.log("🟢 General Assistant - Transaction details:");
    console.log("  - Contract address:", SEND_SWAP_CONTRACT);
    console.log("  - Value (wei):", value);
    console.log("  - Value (ETH):", web3.utils.fromWei(value, "ether"));
    console.log("  - Command:", command);
    console.log("  - From:", currentAccount);
    
    const tx = await simpleIE.methods.command(command).send({
      from: currentAccount,
      value: value,
      gas: 500000
    });
    
    console.log("🟢 General Assistant - ✅ Transaction successful:", tx.transactionHash);
    console.log("🟢 General Assistant - Transaction logs:", tx.logs);
    return tx;

  } catch (error) {
    console.error("🟢 General Assistant - ❌ Error in commandToSimpleIE:", error);
    throw error;
  }
}

/**
 * DeFi Assistant Functions
 */

/**
 * Parses a DeFi command and executes the appropriate Aave function - used by DeFi Assistant
 * @param {string} commandFromLLM - Command from the LLM (e.g., "deposit 100 usdc")
 */
export async function commandToAave(commandFromLLM) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }

  console.log("🔵 DeFi Assistant - Executing Aave command:", commandFromLLM);
  
  const aaveContract = new web3.eth.Contract(AAVE_ABI, AAVE_Interactor_Contract);
  
  // Parse the command
  const parts = commandFromLLM.toLowerCase().trim().split(' ');
  const operation = parts[0]; // deposit, borrow, repay, withdraw
  const amount = parts[1]; // amount or "all"
  const tokenSymbol = parts[2]; // usdc, dai, weth, etc.
  const interestRateMode = parts[3] || "2"; // default to variable rate

  console.log("🔵 DeFi Assistant - Parsed command - Operation:", operation, "Amount:", amount, "Token:", tokenSymbol);

  if (!operation || !amount || !tokenSymbol) {
    throw new Error("Invalid command format. Use: 'deposit 100 usdc' or 'borrow 0.5 weth'");
  }

  // Get token address - note that ETH maps to WETH address since Aave only supports ERC20
  const tokenAddress = AAVE_TOKEN_ADDRESSES[tokenSymbol.toUpperCase()];
  console.log("🔵 DeFi Assistant - Token address for", tokenSymbol.toUpperCase(), ":", tokenAddress);
  
  if (!tokenAddress) {
    throw new Error(`Unsupported token: ${tokenSymbol}. Supported tokens: ${Object.keys(AAVE_TOKEN_ADDRESSES).join(", ")}`);
  }

  // Convert amount to the appropriate units based on token
  let amountInWei;
  if (amount === "all") {
    // Get user's balance - for ETH, we check WETH balance since that's what Aave uses
    const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
    const balance = await tokenContract.methods.balanceOf(currentAccount).call();
    amountInWei = balance;
    console.log("🔵 DeFi Assistant - Using 'all' - Token balance:", balance);
  } else {
    // Convert amount based on token type
    if (tokenSymbol.toLowerCase() === "usdc" || tokenSymbol.toLowerCase() === "usdt") {
      // USDC and USDT have 6 decimals
      amountInWei = (parseFloat(amount) * Math.pow(10, 6)).toString();
      console.log("🔵 DeFi Assistant - USDC/USDT amount conversion:", amount, "->", amountInWei);
    } else if (tokenSymbol.toLowerCase() === "wbtc") {
      // WBTC has 8 decimals
      amountInWei = (parseFloat(amount) * Math.pow(10, 8)).toString();
      console.log("🔵 DeFi Assistant - WBTC amount conversion:", amount, "->", amountInWei);
    } else {
      // ETH (as WETH), WETH, DAI, and most other tokens have 18 decimals
      amountInWei = web3.utils.toWei(amount, "ether");
      console.log("🔵 DeFi Assistant - ETH/WETH/DAI amount conversion:", amount, "->", amountInWei);
    }
  }

  console.log(`🔵 DeFi Assistant - Final values - Operation: ${operation}, Amount: ${amountInWei}, Token: ${tokenAddress}`);

  try {
    let tx;
    
    // All operations are ERC20-based since Aave contract only accepts ERC20 tokens
    const txOptions = { from: currentAccount };
    console.log("🔵 DeFi Assistant - Transaction options:", txOptions);
    console.log("🔵 DeFi Assistant - Aave contract address:", AAVE_Interactor_Contract);
    
    switch (operation) {
      case "deposit":
        console.log("🔵 DeFi Assistant - Executing ERC20 deposit, approving first...");
        // First approve the token transfer (all tokens including ETH/WETH are ERC20)
        await approveTokenForAave(tokenAddress, amountInWei);
        
        // Then deposit
        tx = await aaveContract.methods
          .deposit(tokenAddress, amountInWei, currentAccount)
          .send(txOptions);
        console.log("🔵 DeFi Assistant - Deposit transaction:", tx);
        break;
        
      case "borrow":
        console.log("🔵 DeFi Assistant - Executing borrow...");
        tx = await aaveContract.methods
          .borrow(tokenAddress, amountInWei, interestRateMode, currentAccount)
          .send(txOptions);
        console.log("🔵 DeFi Assistant - Borrow transaction:", tx);
        break;
        
      case "repay":
        console.log("🔵 DeFi Assistant - Executing ERC20 repay, approving first...");
        // First approve the token transfer (all tokens including ETH/WETH are ERC20)
        await approveTokenForAave(tokenAddress, amountInWei);
        
        // Then repay
        tx = await aaveContract.methods
          .repay(tokenAddress, amountInWei, interestRateMode, currentAccount)
          .send(txOptions);
        console.log("🔵 DeFi Assistant - Repay transaction:", tx);
        break;
        
      case "withdraw":
        console.log("🔵 DeFi Assistant - Executing withdraw...");
        tx = await aaveContract.methods
          .withdraw(tokenAddress, amountInWei, currentAccount)
          .send(txOptions);
        console.log("🔵 DeFi Assistant - Withdraw transaction:", tx);
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}. Supported operations: deposit, borrow, repay, withdraw`);
    }
    
    return tx;
  } catch (error) {
    console.error(`🔵 DeFi Assistant - 🔴 Error executing ${operation}:`, error);
    throw error;
  }
}

/**
 * Approves token transfer for Aave contract
 */
async function approveTokenForAave(tokenAddress, amount) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }
  
  const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
  
  try {
    console.log("Approving tokens for Aave...");
    const approveTx = await tokenContract.methods
      .approve(AAVE_Interactor_Contract, amount)
      .send({ from: currentAccount });
      
    console.log("Tokens approved for Aave. Tx:", approveTx);
    return true;
  } catch (error) {
    console.error("Error approving tokens for Aave:", error);
    throw error;
  }
}

/**
 * Gets user deposit balance from Aave contract
 */
export async function getUserDeposits(userAddress, tokenAddress) {
  if (!web3) {
    throw new Error("Web3 not initialized");
  }
  
  const aaveContract = new web3.eth.Contract(AAVE_ABI, AAVE_Interactor_Contract);
  
  try {
    const depositAmount = await aaveContract.methods
      .userDeposits(userAddress, tokenAddress)
      .call();
    
    console.log("User deposit amount:", depositAmount);
    return depositAmount;
  } catch (error) {
    console.error("Error fetching user deposits:", error);
    throw error;
  }
}

/**
 * Gets contract owner address
 */
export async function getContractOwner() {
  if (!web3) {
    throw new Error("Web3 not initialized");
  }
  
  const aaveContract = new web3.eth.Contract(AAVE_ABI, AAVE_Interactor_Contract);
  
  try {
    const owner = await aaveContract.methods.owner().call();
    console.log("Contract owner:", owner);
    return owner;
  } catch (error) {
    console.error("Error fetching contract owner:", error);
    throw error;
  }
}

/**
 * Trading Engine Functions - Updated for new TradingEngine contract
 */

// TradingEngine contract configuration (update after deployment)
const TRADING_ENGINE_ADDRESS = "0xfE435387201D3327983d19293B60C1C014E61650"; // Updated with new USDC-based contract address
const TRADING_ENGINE_ABI = [
  {
    "type": "function",
    "name": "buyToken",
    "inputs": [
      {"name": "tokenSymbol", "type": "string"},
      {"name": "amountIn", "type": "uint256"},
      {"name": "minAmountOut", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "sellToken",
    "inputs": [
      {"name": "tokenSymbol", "type": "string"},
      {"name": "amountIn", "type": "uint256"},
      {"name": "minAmountOut", "type": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getExpectedOutput",
    "inputs": [
      {"name": "tokenSymbol", "type": "string"},
      {"name": "amountIn", "type": "uint256"},
      {"name": "isBuy", "type": "bool"}
    ],
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTokenAddress",
    "inputs": [{"name": "symbol", "type": "string"}],
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view"
  }
];

/**
 * Execute a trade using the new TradingEngine contract (USDC-based)
 * @param {string} action - "BUY" or "SELL"
 * @param {string} tokenSymbol - Token symbol (WBTC, DAI, WETH)
 * @param {string} amount - Amount to trade
 */
export async function executeTrade(action, tokenSymbol, amount) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }

  try {
    const tradingContract = new web3.eth.Contract(TRADING_ENGINE_ABI, TRADING_ENGINE_ADDRESS);
    
    console.log(`Executing ${action} trade:`, { tokenSymbol, amount });

    // Smart contract now uses USDC as base currency
    const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // USDC address
    
    if (action.toUpperCase() === "BUY") {
      // BUY means: spend USDC to get the target token
      console.log(`Buying ${tokenSymbol} with USDC`);
      
      // Convert amount to USDC (6 decimals)
      const usdcAmountInWei = web3.utils.toWei(amount.toString(), "mwei"); // mwei = 6 decimals
      
      // Approve USDC for the trading contract
      await approveTokenForTrading(usdcAddress, usdcAmountInWei);
      
      // Get expected output for slippage protection (5% slippage)
      const expectedOutput = await tradingContract.methods
        .getExpectedOutput(tokenSymbol, usdcAmountInWei, true)
        .call();
      const minAmountOut = (BigInt(expectedOutput) * BigInt(95)) / BigInt(100); // 5% slippage
      
      // Execute buy (spend USDC to get tokenSymbol)
      const tx = await tradingContract.methods
        .buyToken(tokenSymbol, usdcAmountInWei, minAmountOut.toString())
        .send({ from: currentAccount });
      
      console.log("Buy transaction completed:", tx.transactionHash);
      return tx;
      
    } else if (action.toUpperCase() === "SELL") {
      // SELL means: sell the target token to get USDC
      console.log(`Selling ${tokenSymbol} for USDC`);
      
      // Convert amount to token decimals (18 decimals for most tokens)
      const tokenAmountInWei = web3.utils.toWei(amount.toString(), "ether");
      
      // Get token address and approve it
      const tokenAddress = await tradingContract.methods
        .getTokenAddress(tokenSymbol)
        .call();
      
      // Approve the target token for selling
      await approveTokenForTrading(tokenAddress, tokenAmountInWei);
      
      // Get expected output for slippage protection (5% slippage)
      const expectedOutput = await tradingContract.methods
        .getExpectedOutput(tokenSymbol, tokenAmountInWei, false)
        .call();
      const minAmountOut = (BigInt(expectedOutput) * BigInt(95)) / BigInt(100); // 5% slippage
      
      // Execute sell (sell tokenSymbol to get USDC)
      const tx = await tradingContract.methods
        .sellToken(tokenSymbol, tokenAmountInWei, minAmountOut.toString())
        .send({ from: currentAccount });
      
      console.log("Sell transaction completed:", tx.transactionHash);
      return tx;
      
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }
    
  } catch (error) {
    console.error("Error executing trade:", error);
    throw error;
  }
}

/**
 * Approve token for the trading engine
 * @param {string} tokenAddress - Token contract address
 * @param {string} amount - Amount to approve in wei
 */
export async function approveTokenForTrading(tokenAddress, amount) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }
  
  try {
    const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
    
    console.log("Approving tokens for trading:", { tokenAddress, amount });
    
    const approveTx = await tokenContract.methods
      .approve(TRADING_ENGINE_ADDRESS, amount)
      .send({ from: currentAccount });
      
    console.log("Tokens approved for trading. Tx:", approveTx.transactionHash);
    return true;
  } catch (error) {
    console.error("Error approving tokens for trading:", error);
    throw error;
  }
}

/**
 * Get trading signals from Python backend
 * @param {string} pair - Trading pair (weth_usdc, wbtc_usdc, dai_usdc)
 * @param {string} term - Term (short, long)
 * @param {string} riskLevel - Risk level (high, low)
 */
export const getTradingSignals = async (pair, term, riskLevel) => {
  try {
    console.log(`Fetching trading signals from Python backend: ${pair} ${term} ${riskLevel}`);
    
    // Map frontend pair names to backend endpoints
    const pairMapping = {
      'weth_usdc': 'http://localhost:5050',
      'wbtc_usdc': 'http://localhost:5051', 
      'dai_usdc': 'http://localhost:5052'
    };
    
    const baseUrl = pairMapping[pair];
    if (!baseUrl) {
      throw new Error(`Unsupported trading pair: ${pair}`);
    }
    
    const url = `${baseUrl}/decisions/${term}/${riskLevel}`;
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors'
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Trading signals received:', data);
    
    // Return the full response data
    return data;
    
  } catch (error) {
    console.error('Error fetching trading signals:', error);
    
    // Return a mock response for testing if the backend is unreachable
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.warn('Backend unreachable, returning mock data for testing');
      return {
        algorithm: term === 'short' ? 'RSI' : 'MACD',
        decision: {
          signal: pair === 'weth_usdc' ? 'SELL' : pair === 'wbtc_usdc' ? 'BUY' : 'HOLD',
          confidence: 'MEDIUM'
        },
        mock: true
      };
    }
    
    throw error;
  }
};