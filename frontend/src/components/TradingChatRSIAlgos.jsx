import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { PriceChartWidget } from './PriceChartWidget'; 
import { useNavigate } from 'react-router-dom';

import { 
  connectWallet as connectToWallet, 
  fetchTokenBalances,
  getTradingSignals,
  executeTrade
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
    WBTC: '0.0',
    USDC: '0.0'
  });
  const [tradingSignals, setTradingSignals] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [riskLevel, setRiskLevel] = useState('low'); // default to low risk
  const [term, setTerm] = useState('short'); // default to short term
  const [errorMessage, setErrorMessage] = useState('');
  const [inputAmounts, setInputAmounts] = useState({});
  const [isTrading, setIsTrading] = useState(false);

  const navigate = useNavigate();

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

  // Generate signals from Python backend
  const generateSignals = async () => {
    if (!walletConnected) {
      setErrorMessage('Please connect your wallet before generating signals.');
      return;
    }
  
    console.log("Generating signals with risk level:", riskLevel, "and term:", term);
    setLoadingSignals(true);
    setErrorMessage('');
    
    try {
      // Get signals for all supported pairs
      const pairs = ['weth_usdc', 'wbtc_usdc', 'dai_usdc'];
      const allSignals = {};
      
      for (const pair of pairs) {
        try {
          console.log(`Fetching signals for ${pair}...`);
          const signalData = await getTradingSignals(pair, term, riskLevel);
          console.log(`Raw signal data for ${pair}:`, signalData);
          allSignals[pair] = signalData;
        } catch (error) {
          console.error(`Error fetching signals for ${pair}:`, error);
          allSignals[pair] = { error: error.message };
        }
      }
      
      console.log("All signals received:", allSignals);
  
      // Transform signals into the format expected by the UI
      const transformedSignals = {
        timestamp: Date.now(),
        riskLevel,
        term,
        algorithm: getAlgorithmName(term, riskLevel),
        decisions: {}
      };
      
      // Helper function to safely extract string values
      const extractDecision = (signalData) => {
        console.log("Extracting decision from:", signalData);
        
        if (!signalData || signalData.error) {
          console.log("No signal data or error present, returning HOLD");
          return 'HOLD';
        }
        
        // Handle mock data from fallback
        if (signalData.mock && signalData.decision && signalData.decision.signal) {
          console.log("Mock data detected, using decision.signal:", signalData.decision.signal);
          return signalData.decision.signal.toUpperCase();
        }
        
        // Handle Python backend response format
        if (signalData.decision && signalData.decision.signal) {
          console.log("Found decision.signal:", signalData.decision.signal);
          return signalData.decision.signal.toUpperCase();
        }
        
        if (signalData.algorithm_data && signalData.algorithm_data.latest_signal) {
          console.log("Found algorithm_data.latest_signal:", signalData.algorithm_data.latest_signal);
          return signalData.algorithm_data.latest_signal.toUpperCase();
        }
        
        // Fallback checks
        if (typeof signalData.decision === 'string') {
          console.log("Found string decision:", signalData.decision);
          return signalData.decision.toUpperCase();
        }
        
        if (typeof signalData.signal === 'string') {
          console.log("Found string signal:", signalData.signal);
          return signalData.signal.toUpperCase();
        }
        
        console.log("No recognizable signal found, returning HOLD");
        return 'HOLD';
      };
      
      const extractConfidence = (signalData) => {
        if (!signalData || signalData.error) return 'MEDIUM';
        
        if (signalData.mock && signalData.decision && signalData.decision.confidence) {
          return signalData.decision.confidence.toUpperCase();
        }
        
        if (signalData.decision && signalData.decision.confidence) {
          return signalData.decision.confidence.toUpperCase();
        }
        
        if (typeof signalData.confidence === 'string') {
          return signalData.confidence.toUpperCase();
        }
        
        return 'MEDIUM';
      };
      
      // Map pair signals to token decisions
      const pairToToken = {
        'weth_usdc': 'WETH',
        'wbtc_usdc': 'WBTC', 
        'dai_usdc': 'DAI'
      };
      
      for (const [pair, tokenSymbol] of Object.entries(pairToToken)) {
        const pairData = allSignals[pair];
        const action = extractDecision(pairData);
        const confidence = extractConfidence(pairData);
        
        console.log(`${tokenSymbol} decision: ${action}, confidence: ${confidence}`);
        
        transformedSignals.decisions[tokenSymbol] = {
          action: action,
          confidence: confidence,
          data: pairData
        };
      }
      
      console.log("Final transformed signals:", transformedSignals);
      setTradingSignals(transformedSignals);
      
      // Prepopulate reasonable amounts (in USDC for buying, in token amount for selling)
      setInputAmounts({
        WETH: "100", // 100 USDC to buy WETH, or 0.04 WETH to sell
        WBTC: "1000", // 1000 USDC to buy WBTC, or 0.01 WBTC to sell  
        DAI: "100" // 100 USDC to buy DAI, or 100 DAI to sell
      });
      
    } catch (error) {
      console.error('Error generating signals:', error);
      setErrorMessage('Failed to generate signals. Please ensure the Python trading servers are running.');
    } finally {
      setLoadingSignals(false);
    }
  };

  // Get algorithm name based on term and risk
  const getAlgorithmName = (term, risk) => {
    const mapping = {
      'short_high': 'RSI',
      'long_high': 'MACD',
      'short_low': 'MA',
      'long_low': 'DCA'
    };
    return mapping[`${term}_${risk}`] || 'Unknown';
  };

  // Handle trade execution using new TradingEngine
  const handleTrade = async (token, decision) => {
    console.log(`Handling trade for token: ${token}`, decision);
    const amount = inputAmounts[token];
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setErrorMessage('Please enter a valid amount.');
      return;
    }

    setIsTrading(true);
    setErrorMessage('');
    
      try {
      console.log(`Executing ${decision.action} for ${token} with amount: ${amount}`);
      
      const tx = await executeTrade(decision.action, token, amount);
      
      console.log("Trade execution result:", tx);
      setErrorMessage(`✅ Trade executed successfully! Transaction: ${tx.transactionHash}`);
      
      // Refresh balances after trade
      setTimeout(async () => {
        try {
          const newBalances = await fetchTokenBalances(walletAddress);
          setBalances(newBalances);
        } catch (error) {
          console.error('Error refreshing balances:', error);
        }
      }, 3000);
      
    } catch (error) {
      console.error("Trade execution failed:", error);
      setErrorMessage(`❌ Trade failed: ${error.message}`);
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B1E] text-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-[#1A1B3B] to-[#0B1B1E] p-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 onClick={() => navigate('/')} className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
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
            <h2 className="text-2xl font-semibold mb-4">
              Trading Signals ({tradingSignals.algorithm} Algorithm)
            </h2>
            <div className="mb-4 text-sm text-gray-400">
              <p>Risk Level: {tradingSignals.riskLevel} | Term: {tradingSignals.term}</p>
              <p>Generated at: {new Date(tradingSignals.timestamp).toLocaleTimeString()}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(tradingSignals.decisions).map(([token, decision]) => {
                const action = String(decision.action || 'HOLD').toUpperCase();
                const confidence = String(decision.confidence || 'MEDIUM').toUpperCase();
                
                return (
                <div key={token} className="bg-[#1A1B3B] rounded-xl p-6 border border-gray-800">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold">{token}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        action === 'BUY'
                        ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                          : action === 'SELL'
                        ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                        : 'bg-gray-600/20 text-gray-400 border border-gray-500/30'
                    }`}>
                        {action}
                    </span>
                  </div>
                    
                    {/* Display algorithm and confidence */}
                    <div className="mb-4 text-sm text-gray-400">
                      <p>Algorithm: {tradingSignals.algorithm}</p>
                      <p>Confidence: {confidence}</p>
                      {decision.data && decision.data.mock && (
                        <p className="text-yellow-400">⚠️ Mock Data (Backend Unreachable)</p>
                      )}
                    </div>
                    
                    {/* Show trading input only for BUY/SELL signals */}
                    {(action === 'BUY' || action === 'SELL') && (
                    <div>
                        <div className="mb-3 p-3 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                          <p className="text-blue-400 text-sm font-medium">
                            🤖 Algorithm Recommendation: {action} {token}
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            Confidence Level: {confidence} | Trading Pair: {token}/USDC
                          </p>
                        </div>
                        
                        <label htmlFor={`amount-${token}`} className="block text-sm text-gray-400 mb-2">
                          {action === 'BUY' ? `USDC to spend buying ${token}:` : `${token} to sell for USDC:`}
                      </label>
                      <input
                        id={`amount-${token}`}
                        type="text"
                        value={inputAmounts[token] || '0.1'}
                        onChange={(e) =>
                          setInputAmounts((prev) => ({ ...prev, [token]: e.target.value }))
                        }
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                          placeholder={action === 'BUY' ? 
                            (token === 'WETH' ? '100 USDC' : token === 'WBTC' ? '1000 USDC' : '100 USDC') :
                            (token === 'WBTC' ? '0.01' : token === 'DAI' ? '100' : '0.04')
                          }
                      />
                      <button
                        onClick={() => handleTrade(token, decision)}
                          disabled={isTrading}
                          className={`mt-3 w-full px-4 py-2 rounded transition font-medium ${
                            isTrading 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : action === 'BUY'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {isTrading ? 'Processing...' : 
                           action === 'BUY' ? `Buy ${token} with USDC` : `Sell ${token} for USDC`}
                      </button>
                    </div>
                  )}
                    
                    {/* Show message for HOLD signals */}
                    {action === 'HOLD' && (
                      <div className="p-3 bg-gray-600/10 border border-gray-500/20 rounded-lg">
                        <p className="text-gray-400 text-sm">
                          🤖 Algorithm recommends holding {token} at current market conditions.
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          No strong buy or sell signal detected.
                        </p>
                      </div>
                    )}
                </div>
                );
              })}
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
