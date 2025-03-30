import React, { useState } from 'react';
import { connectWallet as connectToWallet, fetchTokenBalances } from '../utils/web3functions';

const TokenPortfolio = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balances, setBalances] = useState({
    WETH: '0.0',
    DAI: '0.0',
    WBTC: '0.0'
  });

  const connectWallet = async () => {
    try {
      const { account } = await connectToWallet();
      setWalletAddress(account);
      setWalletConnected(true);

      const tokenBalances = await fetchTokenBalances(account);
      setBalances(tokenBalances);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-800 to-blue-700">
      <h1 className="text-3xl font-bold text-white mb-6">Token Portfolio</h1>
      
      {!walletConnected ? (
        <button 
          onClick={connectWallet}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-md transition-colors duration-200"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="bg-gray-900 rounded-lg p-6 shadow-lg max-w-md w-full">
          <div className="mb-4">
            <p className="text-gray-400 mb-1">Wallet:</p>
            <p className="text-gray-200 break-all text-sm">{walletAddress}</p>
          </div>
          
          <div>
            <h2 className="text-xl text-white mb-3">Balances</h2>
            
            {Object.entries(balances).map(([token, balance]) => (
              <div 
                key={token} 
                className="flex justify-between items-center py-3 border-b border-gray-800"
              >
                <span className="text-gray-200">{token}</span>
                <span className="text-gray-200">{balance}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenPortfolio;
