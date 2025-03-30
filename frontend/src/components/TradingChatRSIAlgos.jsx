import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';

const data = [
  { name: 'Jan', BTC: 42000, ETH: 3200 },
  { name: 'Feb', BTC: 44500, ETH: 3100 },
  { name: 'Mar', BTC: 47000, ETH: 3300 },
  { name: 'Apr', BTC: 41000, ETH: 2900 },
  { name: 'May', BTC: 39000, ETH: 2700 },
  { name: 'Jun', BTC: 43000, ETH: 3000 },
];

const tradingSignals = {
  timestamp: 1743319056,
  decisions: {
    BTC: {
      action: "SELL",
      price: 83137.6158732534
    },
    DAI: {
      action: "BUY",
      price: 1.0
    },
    WETH: {
      action: "BUY",
      price: 1.0
    }
  }
};

function IntentAI2() {
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0B1E] text-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-[#1A1B3B] to-[#0A0B1E] p-8 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Stratos
            </h1>
            <button
              onClick={() => setIsConnected(!isConnected)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isConnected
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                  : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
              }`}
            >
              <Wallet size={20} />
              {isConnected ? 'Connected' : 'Connect Wallet'}
            </button>
          </div>
          <p className="mt-4 text-gray-400">
            Advanced Quantitative Trading Platform
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Trading Signals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(tradingSignals.decisions).map(([token, decision]) => (
            <div key={token} className="bg-[#1A1B3B] rounded-xl p-6 border border-gray-800">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{token}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  decision.action === 'BUY' 
                    ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                    : 'bg-red-600/20 text-red-400 border border-red-500/30'
                }`}>
                  {decision.action}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  ${decision.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
                {decision.action === 'BUY' ? (
                  <ChevronUp className="text-green-400" size={20} />
                ) : (
                  <ChevronDown className="text-red-400" size={20} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Price Chart */}
        <div className="bg-[#1A1B3B] rounded-xl p-6 mb-8 border border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={24} className="text-blue-400" />
            <h2 className="text-xl font-semibold">Market Analysis</h2>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2E4A" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1B3B',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="BTC"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="ETH"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="bg-[#1A1B3B] rounded-xl p-6 border border-gray-800">
          <div className="flex items-center gap-2 mb-6">
            <Wallet size={24} className="text-blue-400" />
            <h2 className="text-xl font-semibold">Portfolio Overview</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(tradingSignals.decisions).map(([token, decision]) => (
              <div key={token} className="flex justify-between items-center p-4 rounded-lg bg-[#0A0B1E]/50">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{token}</span>
                  <span className="text-sm text-gray-400">
                    {token === 'BTC' ? '2.5' : token === 'WETH' ? '15.8' : '1000'} {token}
                  </span>
                </div>
                <span className={decision.action === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                  ${decision.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntentAI2;