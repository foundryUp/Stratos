import Web3 from "web3";
import {
  TradeABI,
  TradeContractAddress,
  ERC20ABI,
  WETH_ABI,
  GeneralContractAddress,
  GeneralABI,
  AAVE_Interactor_Contract,
  SEND_SWAP_ABI,
  SEND_SWAP_CONTRACT,
} from "../constants/abi";
import SimpleIEABI from "../abi/SimpleIE.json";
import { SimpleIEAddress } from "../constants/addresses";

let web3;
let currentAccount = "";

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
  
  const tokenAddresses = {
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  };
  const balancesObj = {};
  try {
    for (const [token, address] of Object.entries(tokenAddresses)) {
      const tokenContract = new web3.eth.Contract(ERC20ABI, address);
      console.log(`Fetching ${token} balance from ${address}...`);
      const balance = await tokenContract.methods.balanceOf(account).call();
      console.log(`${token} raw balance:`, balance);
      // Assuming 18 decimals; adjust if needed
      balancesObj[token] = web3.utils.fromWei(balance, "ether");
    }
    console.log("User Token Balances:", balancesObj);
    return balancesObj;
  } catch (error) {
    console.error("Error fetching balances:", error);
    throw error;
  }
}

/**
 * Calls the trade contract's returnIntentValues method.
 */
export async function returnIntentValues(aiResponse) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }
  const tradeContract = new web3.eth.Contract(TradeABI, TradeContractAddress);
  try {
    console.log("Calling returnIntentValues with aiResponse:", aiResponse);
    // Assuming the contract method is callable with .call()
    const response = await tradeContract.methods
      .returnIntentValues(aiResponse)
      .call({ from: currentAccount });
    console.log("Contract response:", response);
    return response; // Response array expected
  } catch (error) {
    console.error("Error calling returnIntentValues:", error);
    throw error;
  }
}

export async function returnIntentValuesFromGeneral(aiResponse) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }
  const contract = new web3.eth.Contract(GeneralABI, GeneralContractAddress);
  try {
    console.log("Calling returnIntentValues with aiResponse:", aiResponse);
    // Assuming the contract method is callable with .call()
    const response = await contract.methods
      .returnIntentValues(aiResponse)
      .call({ from: currentAccount });
    console.log("Contract response:", response);
    return response; // Response array expected
  } catch (error) {
    console.error("Error calling returnIntentValues general contract:", error);
    throw error;
  }
}

/**
 * Deposits ETH to get WETH.
 */
export async function giveWeth() {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }
  const wethContract = new web3.eth.Contract(WETH_ABI, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
  try {
    console.log("WETH contract:", wethContract);
    const depositTx = await wethContract.methods.deposit().send({
      from: currentAccount,
      value: web3.utils.toWei("10", "ether"),
    });
    console.log("Depositing ETH to WETH, transaction:", depositTx);
    const balance = await wethContract.methods.balanceOf(currentAccount).call();
    console.log("Updated WETH balance:", web3.utils.fromWei(balance, "ether"));
    return balance;
  } catch (error) {
    console.error("Error giving WETH:", error);
    throw error;
  }
}

/**
 * Approves token transfer for trading.
 * @param {string|number} amountToTrade - Amount (in wei or as a string) to approve.
 */
export async function handleTokensApprove(amountToTrade,tokenAddress) {
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

export async function approveAAVEInteractor(amountToTrade,tokenAddress) {
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
      .approve(AAVE_Interactor_Contract, amountInWei)
      .send({ from: currentAccount });
      
    console.log("Tokens approved. Tx:", approveTx);
    return true;
  } catch (error) {
    console.error("Error approving tokens:", error);
    throw error;
  }
}

/**
 * Sends command to the trade contract.
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

export async function commandToGeneral(aiResponse) {
  console.log("AI RESPONSE !! :", aiResponse);

  // Remove extra spaces and newlines, then trim the string.
  let formattedResponse = aiResponse.replace(/\s+/g, ' ').trim();
  console.log("Before extraction, Formatted AI Response:", formattedResponse);

  // Extract only the first 4 words to enforce the expected format.
  const words = formattedResponse.split(" ").filter(Boolean);
  if (words.length < 4) {
    throw new Error(`Invalid command format. Expected at least 4 words, but got ${words.length}.`);
  }
  formattedResponse = words.slice(0, 4).join(" ");
  console.log("Extracted 4-word command:", formattedResponse);

  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }
  const generalContract = new web3.eth.Contract(GeneralABI, GeneralContractAddress);
  try {
    const tx = await generalContract.methods
      .commandToTrade(formattedResponse)
      .send({ from: currentAccount });
    console.log("Transaction Hash:", tx.transactionHash);
    return tx.transactionHash;
  } catch (error) {
    console.error("Error executing trade command:", error);
    throw error;
  }
}

export async function handleTokensApproveTrading(amountToTrade,tokenAddress) {
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

export async function handleATokenApproveTrading(amountToTrade, tokenName) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }

  // 1) fetch the aToken address from your on‑chain registry
  const general = new web3.eth.Contract(
    GeneralABI,
    GeneralContractAddress
  );
  const aTokenAddress = await general.methods
    .getAAVEAddressFromString(tokenName)
    .call();

  if (
    !aTokenAddress ||
    aTokenAddress === "0x0000000000000000000000000000000000000000"
  ) {
    throw new Error(`No aToken found for ${tokenName}`);
  }

  // 2) instantiate the aToken contract
  const aTokenContract = new web3.eth.Contract(ERC20ABI, aTokenAddress);

  // 3) convert to wei (assumes 18 decimals)
  const amountInWei = web3.utils.toWei(amountToTrade.toString(), "ether");
  console.log("Approving aToken for general contract:", amountInWei);

  // 4) send the approval tx
  const tx = await aTokenContract.methods
    .approve(GeneralContractAddress, amountInWei)
    .send({ from: currentAccount });

  console.log("aToken approval tx hash:", tx.transactionHash);
  return true;
}

export async function handleApproveFromTokenToSwap(amountToTrade, tokenName) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }

  // 1) fetch the aToken address from your on‑chain registry
  const general = new web3.eth.Contract(
    GeneralABI,
    GeneralContractAddress
  );
  const tokenaddress = await general.methods
    .getAddressFromString(tokenName)
    .call();

  // 2) instantiate the aToken contract
  const TokenContract = new web3.eth.Contract(ERC20ABI, tokenaddress);

  // 3) convert to wei (assumes 18 decimals)
  const amountInWei = web3.utils.toWei(amountToTrade.toString(), "ether");
  console.log("Approving aToken for general contract:", amountInWei);

  // 4) send the approval tx
  const tx = await TokenContract.methods
    .approve(GeneralContractAddress, amountInWei)
    .send({ from: currentAccount });

  console.log("Token  approval tx hash for swap:", tx.transactionHash);
  return true;
}

export async function commandToSimpleIE(commandFromLLM) {
  if (!web3 || !currentAccount) {
    throw new Error("Wallet not connected");
  }

  try {
    console.log("Command from LLM:", commandFromLLM);
    
    // 1. Normalize the command (lowercase and clean spaces)
    const command = commandFromLLM.toLowerCase().trim().replace(/\s+/g, ' ');
    const parts = command.split(" ");
    
    // 2. Handle token approvals for swaps
    if (parts[0] === "swap") {
      const amountEth = parts[1];
      const tokenSymbol = parts[2];
      const amountWei = web3.utils.toWei(amountEth, "ether");

      // Skip approval if using ETH as input
      if (tokenSymbol !== "eth" && tokenSymbol !== "ether") {
        // Standard token addresses on ETH mainnet
        const TOKEN_ADDRESSES = {
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

        const tokenAddress = TOKEN_ADDRESSES[tokenSymbol];
        if (!tokenAddress) {
          throw new Error(`Unsupported token symbol: ${tokenSymbol}. Supported tokens: ${Object.keys(TOKEN_ADDRESSES).join(", ")}`);
        }

        // Handle decimals for USDC and USDT (6 decimals) vs others (18 decimals)
        const isDecimal6Token = tokenSymbol === "usdc" || tokenSymbol === "usdt";
        const amountToApprove = isDecimal6Token ? 
          web3.utils.toWei(amountEth, "mwei") :  // 6 decimals
          web3.utils.toWei(amountEth, "ether");  // 18 decimals
        
        console.log(`Approving ${amountEth} ${tokenSymbol.toUpperCase()} for SimpleIE contract...`);
        const token = new web3.eth.Contract(ERC20ABI, tokenAddress);
        
        try {
          await token.methods
            .approve(SEND_SWAP_CONTRACT, amountToApprove)
            .send({ from: currentAccount });
          console.log(`✅ ${tokenSymbol.toUpperCase()} approval successful`);
        } catch (approvalError) {
          console.error(`Failed to approve ${tokenSymbol.toUpperCase()}:`, approvalError);
          throw new Error(`${tokenSymbol.toUpperCase()} approval failed: ${approvalError.message}`);
        }
      }
    }

    // 3. Execute the command
    console.log("Executing command:", command);
    const simpleIE = new web3.eth.Contract(SEND_SWAP_ABI, SEND_SWAP_CONTRACT);
    
    // Set value for ETH sends/swaps
    const value = (
      (parts[0] === "send" && parts[2] === "eth") || 
      (parts[0] === "swap" && parts[2] === "eth")
    ) ? web3.utils.toWei(parts[1], "ether") : "0";
    
    const tx = await simpleIE.methods.command(command).send({
      from: currentAccount,
      value: value,
      gas: 500000  // Match the gas limit from testsendswap.js
    });
    
    console.log("✅ Transaction successful:", tx.transactionHash);
    return tx;

  } catch (error) {
    console.error("❌ Error in commandToSimpleIE:", error);
    throw error;
  }
}