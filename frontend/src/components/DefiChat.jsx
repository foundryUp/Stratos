import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader,
  Home,
  Wallet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import {
  connectWallet,
  fetchTokenBalances,
  commandToAave,
} from "../utils/web3functions";

const DefiChat = () => {
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "🏦 Welcome to DeFi Assistant! I can help you interact with Aave protocol. You can deposit collateral, borrow assets, repay loans, and withdraw collateral. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [account, setAccount] = useState("");
  const [balances, setBalances] = useState({});

  // Auto-scroll chat container
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleConnectWallet = async () => {
    try {
      const { account } = await connectWallet();
      setAccount(account);
      const balancesObj = await fetchTokenBalances(account);
      setBalances(balancesObj);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Check if wallet is connected
    if (!account) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Please connect your wallet first to interact with Aave protocol." },
      ]);
      return;
    }

    // Add user message to chat
    const userMessage = { type: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get all messages for context
      const updatedMessages = [...messages, userMessage];
      const prompt = updatedMessages
        .map((msg) => `${msg.type === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");

      // Use environment variable for backend URL, fallback to localhost for development  
      const NODE_BACKEND_URL = process.env.REACT_APP_NODE_BACKEND_URL || 'http://localhost:5001';

      // Call backend API for DeFi chat
      const response = await fetch(`${NODE_BACKEND_URL}/api/defichat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          balances,
          account,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      console.log("Response from backend:", data);

      if (!data.response) {
        throw new Error("Invalid response from server");
      }

      // Parse the command from the response
      let commandObj;
      try {
        commandObj = JSON.parse(data.response);
        console.log("Parsed command object:", commandObj);
      } catch (error) {
        console.error("Error parsing command:", error);
        throw new Error("Invalid command format from server");
      }
      
      if (!commandObj || (!commandObj.command && !commandObj.message)) {
        throw new Error("Invalid command format from server");
      }

      // If it's just a message (no action needed)
      if (commandObj.message && !commandObj.command) {
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: commandObj.message },
        ]);
        return;
      }

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: `I'll help you with that. Executing: ${commandObj.command}` },
      ]);

      // Execute the DeFi command using the Aave contract
      console.log("Executing DeFi command:", commandObj.command);
      const tx = await commandToAave(commandObj.command);
      console.log("Aave transaction result:", tx);
      
      // Add success message
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: `DeFi operation executed successfully! 🎉\nTransaction hash: ${tx.transactionHash}` },
      ]);

    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.message.includes("User denied")) {
        errorMessage = "Transaction was rejected in your wallet.";
      } else if (error.message.includes("Invalid command format")) {
        errorMessage = "Invalid command format received from server.";
      } else if (error.message.includes("Server error")) {
        errorMessage = "Server is busy. Please try again in a few moments.";
      } else if (error.message.includes("insufficient funds")) {
        errorMessage = "You don't have enough funds to complete this transaction.";
      } else if (error.message.includes("Unsupported token")) {
        errorMessage = "The specified token is not supported. Please use DAI, WETH, WBTC, or USDC.";
      } else if (error.message.includes("Invalid command format")) {
        errorMessage = "Please specify a valid command format. Example: 'deposit 100 usdc' or 'borrow 0.5 weth'";
      }

      setMessages((prev) => [
        ...prev,
        { type: "bot", content: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0014] relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0014] via-[#0f0022] to-[#0a0014]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a1f3f2e_1px,transparent_1px),linear-gradient(to_bottom,#2a1f3f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      {/* Glowing orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-full filter blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-full filter blur-[120px] animate-pulse delay-700"></div>

      {/* Left Side - 3D Spline Scene */}
      <div className="w-1/2 p-8 flex flex-col items-center justify-center relative">
        <div className="text-center space-y-8 relative z-10 max-w-3xl">
          {/* Header Badge */}
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <p className="text-sm text-white/70">
                  DeFi-Powered • Aave Protocol • Smart Contracts
                </p>
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-7xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500 animate-gradient-x">
                DeFi
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-300">
                Assistant
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto font-light">
              Seamlessly interact with Aave protocol - deposit collateral, borrow assets, 
              repay loans, and withdraw with AI-powered assistance!
            </p>
          </div>

          {/* Spline Container */}
          <div className="relative w-full h-[500px]">
            <Spline scene="https://prod.spline.design/6cBpFzCL5rJzFnLv/scene.splinecode" />
          </div>
        </div>
      </div>

      {/* Right Side - Chat Interface */}
      <div className="w-1/2 flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 backdrop-blur-xl bg-black/20">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10"
            >
              <Home size={20} className="text-white/70" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-white">DeFi Assistant</h2>
              <p className="text-sm text-white/60">Aave Protocol Integration</p>
            </div>
          </div>
          {!account ? (
            <button
              onClick={handleConnectWallet}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
            >
              <Wallet size={18} />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div className="text-sm text-white/70">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : "bg-white/5 text-white/90 border border-white/10"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <Loader className="animate-spin" size={16} />
                  <span className="text-white/70">Processing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/10 backdrop-blur-xl bg-black/20">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about DeFi operations like deposit, borrow, repay, or withdraw..."
                className="w-full p-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="2"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:shadow-none"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefiChat; 