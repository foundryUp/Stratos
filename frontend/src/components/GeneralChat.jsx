import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import Spline from '@splinetool/react-spline';
import { ethers } from 'ethers';

const CompoundChat = () => {
  const chatContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "📈 Welcome to Compound Assistant! I can help you deposit and withdraw ETH using Compound. Try commands like 'deposit 0.1 ETH' or 'withdraw 0.05 ETH'."
    }
  ]);
  const [input, setInput] = useState('');
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Add your contract addresses here
  const COMPOUND_MANAGER_ADDRESS = "YOUR_COMPOUND_MANAGER_ADDRESS";
  const CETH_ADDRESS = "YOUR_CETH_ADDRESS";
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        const signer = await provider.getSigner();
        setSigner(signer);
        
        setMessages(prev => [...prev, {
          type: 'bot',
          content: `Wallet connected! Address: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`
        }]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setMessages(prev => [...prev, {
          type: 'bot',
          content: "Error connecting wallet. Please try again."
        }]);
      }
    } else {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "MetaMask is not installed! Please install it to use this feature."
      }]);
    }
  };

  const executeCompoundCommand = async (command) => {
    if (!signer) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "Please connect your wallet first!"
      }]);
      return;
    }

    try {
      const CompoundIntents = new ethers.Contract(
        COMPOUND_MANAGER_ADDRESS,
        ["function command(string calldata intent) external payable"],
        signer
      );

      let tx;
      const parts = command.toLowerCase().split(' ');
      if (parts[0] === 'deposit') {
        const amount = ethers.parseEther(parts[1]);
        tx = await CompoundIntents.command(command, { value: amount });
      } else if (parts[0] === 'withdraw') {
        tx = await CompoundIntents.command(command);
      }

      await tx.wait();
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `Transaction successful! Hash: ${tx.hash}`
      }]);
    } catch (error) {
      console.error("Transaction failed:", error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `Transaction failed: ${error.message}`
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { type: 'user', content: input }]);
    setIsLoading(true);

    const command = input.toLowerCase();
    if (command.startsWith('deposit') || command.startsWith('withdraw')) {
      await executeCompoundCommand(command);
    } else {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "Please use commands like 'deposit 0.1 ETH' or 'withdraw 0.05 ETH'"
      }]);
    }

    setInput('');
    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0014] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0014] via-[#0f0022] to-[#0a0014]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a1f3f2e_1px,transparent_1px),linear-gradient(to_bottom,#2a1f3f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-full filter blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-full filter blur-[120px] animate-pulse delay-700"></div>

      <div className="w-1/2 p-8 flex flex-col items-center justify-center relative">
        <div className="text-center space-y-8 relative z-10 max-w-3xl">
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <p className="text-sm text-white/70">Compound • ETH • DeFi</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-7xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500 animate-gradient-x">
                Compound
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-300">
                AI
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto font-light">
              Interact with Compound protocol using natural language commands
            </p>
          </div>

          <div className="relative w-full h-[500px]">
            <Spline scene="https://prod.spline.design/6cBpFzCL5rJzFnLv/scene.splinecode" />
          </div>
        </div>
      </div>

      <div className="w-1/2 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm"></div>
                      <div className="relative w-12 h-12 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                        <span className="text-2xl">🏦</span>
                      </div>
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-lg">Compound Assistant</h2>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <p className="text-white/60 text-sm">Ready for Commands</p>
                      </div>
                    </div>
                  </div>
                </div>

                {!account && (
                  <button
                    onClick={connectWallet}
                    className="w-full p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>

              <div ref={chatContainerRef} className="h-[400px] overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl backdrop-blur-sm ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-none'
                        : 'bg-white/5 text-white rounded-bl-none border border-white/10'
                    }`}>
                      <p className="leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center space-x-2 text-white/60">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing transaction...</span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="relative group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover/input:opacity-50 transition duration-500"></div>
                  <div className="relative flex space-x-3">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type 'deposit 0.1 ETH' or 'withdraw 0.05 ETH'..."
                      rows="1"
                      className="flex-1 p-3 bg-black/50 backdrop-blur-xl text-white placeholder-white/40 border border-white/10 rounded-2xl focus:outline-none focus:border-white/20 resize-none transition-all duration-300"
                      style={{
                        height: '48px',
                        minHeight: '48px',
                        maxHeight: '120px'
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={isLoading}
                      className="relative group/button"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur opacity-75 group-hover/button:opacity-100 transition duration-500"></div>
                      <div className="relative px-4 py-3 bg-black/50 backdrop-blur-xl rounded-xl border border-white/10 group-hover/button:border-white/20 transition-all duration-300">
                        <Send className="w-5 h-5 text-white" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompoundChat;