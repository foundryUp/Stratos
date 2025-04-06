import Web3 from "web3";
import {
  TradeABI,
  TradeContractAddress,
  ERC20ABI,
  WETH_ABI,
  GeneralContractAddress,
  GeneralABI,
  AAVE_Interactor_Contract
} from "../constants/abi";

let web3;
let currentAccount = "";

/**
 * Connects to MetaMask (or any window.ethereum wallet) and returns { web3, account }
 */
export async function connectWallet() {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      currentAccount = accounts[0];
      console.log("Wallet connected, account:", currentAccount);
      return { web3, account: currentAccount };
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  } else {
    alert("MetaMask is not installed!");
    throw new Error("MetaMask is not installed");
  }
}

/**
 * Fetch token balances for a given account.
 */
export async function fetchTokenBalances(account) {
  if (!web3) throw new Error("Web3 is not initialized");
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

// export async function handleApproveFromTokenToSwap(amountToTrade, tokenName) {
//   if (!web3 || !currentAccount) {
//     throw new Error("Wallet not connected");
//   }

//   // 1) fetch the aToken address from your on‑chain registry
//   const general = new web3.eth.Contract(
//     GeneralABI,
//     GeneralContractAddress
//   );
//   const tokenaddress = await general.methods
//     .getAddressFromString(tokenName)
//     .call();

//   // 2) instantiate the aToken contract
//   const TokenContract = new web3.eth.Contract(ERC20ABI, tokenaddress);

//   // 3) convert to wei (assumes 18 decimals)
//   const amountInWei = web3.utils.toWei(amountToTrade.toString(), "ether");
//   console.log("Approving aToken for general contract:", amountInWei);

//   // 4) send the approval tx
//   const tx = await TokenContract.methods
//     .approve(GeneralContractAddress, amountInWei)
//     .send({ from: currentAccount });

//   console.log("Token  approval tx hash for swap:", tx.transactionHash);
//   return true;
// }