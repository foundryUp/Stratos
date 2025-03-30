import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { PriceChartWidget } from './PriceChartWidget'; // Adjust path if necessary
import { 
  connectWallet as connectToWallet, 
  fetchTokenBalances,
  commandToTradeStart,
  handleTokensApproveTrading  // New approval function
} from '../utils/web3functions';

// Mapping from token symbols to their contract addresses
const tokenAddresses = {
  BTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC address (as example)
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
};

function IntentTradingAlgo() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState({
    WETH: '0.0',
    DAI: '0.0',
    BTC: '0.0'
  });
  const [tradingSignals, setTradingSignals] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [riskLevel, setRiskLevel] = useState('low'); // default to low risk
  const [term, setTerm] = useState('short'); // default to short term
  const [errorMessage, setErrorMessage] = useState('');
  // State to track the input amount per token
  const [inputAmounts, setInputAmounts] = useState({});
  // State to track approval status per token symbol used for approval
  const [approvedTokens, setApprovedTokens] = useState({});

  const connectWallet = async () => {
    console.log("Attempting to connect wallet...");
    try {
      const { account } = await connectToWallet();
      console.log("Wallet connected, account:", account);
      setWalletAddress(account);
      setWalletConnected(true);

      const tokenBalances = await fetchTokenBalances(account);
      console.log("Token balances fetched:", tokenBalances);
      setBalances(tokenBalances);
      setErrorMessage('');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setErrorMessage('Failed to connect wallet. Please try again.');
    }
  };

  // For testing signals before passing to trade function
  const generateSignals = async () => {
    if (!walletConnected) {
      setErrorMessage('Please connect your wallet before generating signals.');
      return;
    }
  
    console.log("Generating signals with risk level:", riskLevel, "and term:", term);
    setLoadingSignals(true);
    setErrorMessage('');
    try {
      // Uncomment the following block to use the API call
      const response = await fetch(
        `http://localhost:5050/decisions?risk=${riskLevel}&term=${term}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Signals received from API:", data);
      setTradingSignals(data);
      // Prepopulate inputAmounts for tokens with BUY or SELL signals
      setInputAmounts({
        BTC: "0.1",
        WETH: "0.1"
      });
      // Reset approvedTokens to ensure fresh approvals on new signals
      setApprovedTokens({});
  
      // --- Custom output for testing (commented out) ---
      /*
      const customData = {
        timestamp: Date.now(),
        decisions: {
          BTC: { action: "BUY" },  // Buying BTC using WETH
          DAI: { action: "HOLD" },
          WETH: { action: "SELL" } // Selling WETH
        }
      };
      console.log("Custom signals generated:", customData);
      setTradingSignals(customData);
      setInputAmounts({
        BTC: "0.1",
        WETH: "0.1"
      });
      setApprovedTokens({});
      */
    } catch (error) {
      console.error('Error generating signals:', error);
      setErrorMessage('Failed to generate signals. Please try again.');
    } finally {
      setLoadingSignals(false);
    }
  };
  

  // When user clicks Trade, approval happens on-demand.
  const handleTrade = async (token, decision) => {
    console.log(`Handling trade for token: ${token}`);
    const amount = inputAmounts[token];
    console.log("Retrieved input amount:", amount);
    if (!amount || isNaN(amount)) {
      alert('Please enter a valid amount.');
      return;
    }
    // For BUY trades, approval is for WETH; for SELL, it's the token itself.
    const tokenToApprove =
      decision.action.toUpperCase() === 'BUY'
        ? tokenAddresses.WETH
        : tokenAddresses[token.toUpperCase()];

    if (!tokenToApprove) {
      alert(`No token address found for ${token}`);
      return;
    }

    // Check and perform approval if needed
    if (!approvedTokens[token]) {
      try {
        console.log(`Approving ${decision.action.toUpperCase() === 'BUY' ? 'WETH' : token} for amount: ${amount}...`);
        const approved = await handleTokensApproveTrading(amount, tokenToApprove);
        if (approved) {
          console.log(`${decision.action.toUpperCase() === 'BUY' ? 'WETH' : token} approved.`);
          setApprovedTokens((prev) => ({ ...prev, [token]: true }));
        }
      } catch (error) {
        console.error(`Error approving ${token}:`, error);
        alert(`Approval failed for ${token}. Check console for details.`);
        return;
      }
    }
    
    // Force action and token symbol to uppercase for consistency
    const action = decision.action.toUpperCase();
    const tokenSymbol = token.toUpperCase();
    // Construct command string: "ACTION TOKEN Amount Uniswap"
    // The command itself doesn't change; your contract should know that for BUY,
    // WETH will be used (via the approval).
    const command = `${action} ${tokenSymbol} ${amount} Uniswap`;
    console.log("Constructed trade command:", command);
    
    try {
      console.log("Passing trade command to commandToTradeStart...");
      const result = await commandToTradeStart(command);
      console.log("Trade execution result:", result);
      alert(`Trade executed: ${command}`);
    } catch (error) {
      console.error("Trade execution failed:", error);
      alert("Trade execution failed. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B1E] text-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-[#1A1B3B] to-[#0B1B1E] p-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Stratos
          </h1>
          <button
            onClick={connectWallet}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              walletConnected
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
            }`}
          >
            <Wallet size={20} />
            {walletConnected ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>
        <p className="mt-4 text-gray-400 text-center">
          Advanced Quantitative Trading Platform
        </p>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-600 text-white px-4 py-2 rounded-md text-center">
            {errorMessage}
          </div>
        )}

        {/* Generate Signals Section */}
        <div className="flex flex-col items-center">
          <button
            onClick={generateSignals}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
          >
            {loadingSignals ? 'Generating...' : 'Generate Trading Signals'}
          </button>
          <div className="flex flex-col md:flex-row gap-6 mt-4">
            {/* Risk Level Options */}
            <div className="flex flex-col items-center">
              <p className="text-gray-400 mb-1">Risk Level</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setRiskLevel('low')}
                  className={`px-4 py-2 rounded ${
                    riskLevel === 'low'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Low Risk
                </button>
                <button
                  onClick={() => setRiskLevel('high')}
                  className={`px-4 py-2 rounded ${
                    riskLevel === 'high'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  High Risk
                </button>
              </div>
            </div>
            {/* Term Options */}
            <div className="flex flex-col items-center">
              <p className="text-gray-400 mb-1">Term</p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTerm('short')}
                  className={`px-4 py-2 rounded ${
                    term === 'short'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Short Term
                </button>
                <button
                  onClick={() => setTerm('long')}
                  className={`px-4 py-2 rounded ${
                    term === 'long'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  Long Term
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Signals Section */}
        {tradingSignals && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Trading Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(tradingSignals.decisions).map(([token, decision]) => (
                <div key={token} className="bg-[#1A1B3B] rounded-xl p-6 border border-gray-800">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{token}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      decision.action === 'BUY'
                        ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                        : decision.action === 'SELL'
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                        : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {decision.action}
                    </span>
                  </div>
                  {(decision.action === 'BUY' || decision.action === 'SELL') && (
                    <div>
                      <label htmlFor={`amount-${token}`} className="block text-sm text-gray-400">
                        Enter Amount (in ETH):
                      </label>
                      <input
                        id={`amount-${token}`}
                        type="text"
                        value={inputAmounts[token] || '0.1'}
                        onChange={(e) =>
                          setInputAmounts((prev) => ({ ...prev, [token]: e.target.value }))
                        }
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                      />
                      <button
                        onClick={() => handleTrade(token, decision)}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Trade
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Chart Section */}
        <div className="bg-[#1A1B3B] rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={24} className="text-blue-400" />
            <h2 className="text-xl font-semibold">Market Analysis</h2>
          </div>
          <div className="h-[400px]">
            <PriceChartWidget />
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="bg-[#1A1B3B] rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Wallet size={24} className="text-blue-400" />
            <h2 className="text-xl font-semibold">Portfolio Overview</h2>
          </div>
          {walletConnected ? (
            <div>
              <div className="mb-4">
                <p className="text-gray-400 mb-1">Wallet:</p>
                <p className="text-gray-200 break-all text-sm">{walletAddress}</p>
              </div>
              <div className="space-y-4">
                {Object.entries(balances).map(([token, balance]) => (
                  <div
                    key={token}
                    className="flex justify-between items-center p-4 rounded-lg bg-[#0A0B1E]/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{token}</span>
                      <span className="text-sm text-gray-400">
                        {balance} {token}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400">Please connect your wallet to view your portfolio.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default IntentTradingAlgo;
