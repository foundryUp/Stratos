import React, { useState } from 'react';
import { Wallet, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import { PriceChartWidget } from './PriceChartWidget'; // Adjust this path if necessary
import { connectWallet as connectToWallet, fetchTokenBalances } from '../utils/web3functions';

function IntentTradingAlgo() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState({
    WETH: '0.0',
    DAI: '0.0',
    WBTC: '0.0'
  });
  const [tradingSignals, setTradingSignals] = useState(null);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [riskLevel, setRiskLevel] = useState('low'); // default to low risk
  const [term, setTerm] = useState('short'); // default to short term
  const [errorMessage, setErrorMessage] = useState('');

  const connectWallet = async () => {
    try {
      const { account } = await connectToWallet();
      setWalletAddress(account);
      setWalletConnected(true);

      const tokenBalances = await fetchTokenBalances(account);
      setBalances(tokenBalances);
      setErrorMessage('');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setErrorMessage('Failed to connect wallet. Please try again.');
    }
  };

  // This function calls your backend with the selected options.
  // It checks if the wallet is connected first.
  const generateSignals = async () => {
    if (!walletConnected) {
      setErrorMessage('Please connect your wallet before generating signals.');
      return;
    }

    setLoadingSignals(true);
    setErrorMessage('');
    console.log("Generate trading signals with options:", { riskLevel, term });

    try {
      // Include risk and term options as query parameters
      const response = await fetch(`http://127.0.0.1:5050/decisions?risk=${riskLevel}&term=${term}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      const data = await response.json();
      // The returned data structure should be similar to:
      // {
      //   "timestamp": 1743319056,
      //   "decisions": {
      //     "BTC": { "action": "SELL", ... },
      //     "DAI": { "action": "BUY", ... },
      //     "WETH": { "action": "BUY", ... }
      //   }
      // }
      setTradingSignals(data);
    } catch (error) {
      console.error('Error generating signals:', error);
      setErrorMessage('Failed to generate signals. Please try again.');
    } finally {
      setLoadingSignals(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B1E] text-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-[#1A1B3B] to-[#0A0B1E] p-8 border-b border-gray-800">
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

          {/* Options: Risk Level and Term */}
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
                        : 'bg-red-600/20 text-red-400 border border-red-500/30'
                    }`}>
                      {decision.action}
                    </span>
                  </div>
                  {/* Optionally add more details like position_size or rsi */}
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
