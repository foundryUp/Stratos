import React, { useState, useRef, useEffect } from "react";
import { Send, Loader, Home, Wallet, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Spline from "@splinetool/react-spline";
import {
  connectWallet,
  fetchTokenBalances,
  executeTrade,
} from "../utils/web3functions";

const TradingChat = () => {
  const navigate = useNavigate();
  const chatContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "📊 Welcome to your AI Trading Assistant! I can provide algorithmic trading signals using RSI, MACD, Moving Averages, and DCA strategies. I can also execute trades for you. How can I help you trade today?",
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
        { type: "bot", content: "Please connect your wallet first to access trading features." },
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

      // Call backend API for trading chat
      const response = await fetch("http://localhost:5001/api/tradingchat", {
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
      console.log("Response from trading backend:", data);

      if (!data.response) {
        throw new Error("Invalid response from server");
      }

      // Parse the response
      let responseObj;
      try {
        responseObj = JSON.parse(data.response);
        console.log("Parsed trading response:", responseObj);
      } catch (error) {
        console.error("Error parsing trading response:", error);
        // If it's not JSON, treat as a direct message
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: data.response },
        ]);
        return;
      }

      // Handle different types of responses
      if (responseObj.message) {
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: responseObj.message },
        ]);
      }

      // Handle trading signals
      if (responseObj.signal) {
        const signalMessage = formatSignalMessage(responseObj.signal, responseObj.message);
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: signalMessage },
        ]);
      }

      // Handle portfolio analysis
      if (responseObj.analysis) {
        const analysisMessage = formatAnalysisMessage(responseObj.analysis, responseObj.message);
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: analysisMessage },
        ]);
      }

      // Handle trade commands
      if (responseObj.command && responseObj.command.startsWith('trade ')) {
        const parts = responseObj.command.split(' ');
        if (parts.length >= 4) {
          const [, action, token, amount] = parts;
          
          setMessages((prev) => [
            ...prev,
            { type: "bot", content: `${responseObj.message}\n\nExecuting ${action} ${amount} ${token}...` },
          ]);

          try {
            const tx = await executeTrade(action, token, amount);
            setMessages((prev) => [
              ...prev,
              { type: "bot", content: `✅ Trade executed successfully!\nTransaction: ${tx.transactionHash}\n\nYour portfolio has been updated.` },
            ]);

            // Refresh balances
            setTimeout(async () => {
              try {
                const newBalances = await fetchTokenBalances(account);
                setBalances(newBalances);
              } catch (error) {
                console.error('Error refreshing balances:', error);
              }
            }, 3000);

          } catch (tradeError) {
            console.error("Trade execution failed:", tradeError);
            setMessages((prev) => [
              ...prev,
              { type: "bot", content: `❌ Trade execution failed: ${tradeError.message}` },
            ]);
          }
        }
      }

    } catch (error) {
      console.error("Error:", error);
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.message.includes("Server error")) {
        errorMessage = "Trading assistant is temporarily unavailable. Please try again in a few moments.";
      }

      setMessages((prev) => [
        ...prev,
        { type: "bot", content: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSignalMessage = (signal, baseMessage) => {
    let message = baseMessage + "\n\n";
    
    if (signal.decision) {
      message += `🎯 **Signal**: ${signal.decision}\n`;
    }
    
    if (signal.confidence) {
      message += `📊 **Confidence**: ${signal.confidence}\n`;
    }
    
    if (signal.algorithm) {
      message += `🧠 **Algorithm**: ${signal.algorithm}\n`;
    }
    
    if (signal.latest_price) {
      message += `💰 **Current Price**: $${signal.latest_price.toFixed(2)}\n`;
    }
    
    if (signal.latest_rsi) {
      message += `📈 **RSI**: ${signal.latest_rsi.toFixed(1)}\n`;
    }
    
    if (signal.latest_signal && signal.latest_macd) {
      message += `📊 **MACD**: ${signal.latest_macd.toFixed(4)}\n`;
      message += `📊 **Signal**: ${signal.latest_signal.toFixed(4)}\n`;
    }
    
    if (signal.reason) {
      message += `\n💡 **Reasoning**: ${signal.reason}`;
    }
    
    return message;
  };

  const formatAnalysisMessage = (analysis, baseMessage) => {
    let message = baseMessage + "\n\n";
    
    if (analysis.balances) {
      message += "**Portfolio Balances:**\n";
      Object.entries(analysis.balances).forEach(([token, balance]) => {
        message += `• ${token}: ${parseFloat(balance).toFixed(4)}\n`;
      });
    }
    
    if (analysis.account) {
      message += `\n**Account**: ${analysis.account}`;
    }
    
    if (analysis.timestamp) {
      message += `\n**Last Updated**: ${new Date(analysis.timestamp).toLocaleString()}`;
    }
    
    return message;
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
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-full filter blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-r from-blue-900/30 to-green-900/30 rounded-full filter blur-[120px] animate-pulse delay-700"></div>

      {/* Left Side - 3D Spline Scene */}
      <div className="w-1/2 p-8 flex flex-col items-center justify-center relative">
        <div className="text-center space-y-8 relative z-10 max-w-3xl">
          {/* Header Badge */}
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <p className="text-sm text-white/70">
                  AI-Powered • Algorithmic Trading • Real-Time Signals
                </p>
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-7xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 animate-gradient-x">
                Trading
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-200 to-blue-300">
                AI
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto font-light">
              Your intelligent trading companion powered by advanced algorithms - RSI, MACD, Moving Averages, and DCA strategies for optimal trading decisions.
            </p>
          </div>

          {/* Spline Container */}
          <div className="relative w-full h-[500px]">
            <Spline scene="https://prod.spline.design/6cBpFzCL5rJzFnLv/scene.splinecode" />
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
            <div className="p-4 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-white/80">Real-time Signals</p>
            </div>
            <div className="p-4 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
              <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-white/80">4 Trading Algorithms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Chat Interface */}
      <div className="w-1/2 flex flex-col relative z-10">
        {/* Header */}
        <div className="border-b border-white/10 p-6 bg-black/20 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Home className="w-5 h-5 text-white" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-white">Trading Assistant</h2>
                <p className="text-sm text-white/60">Algorithmic Trading Signals & Execution</p>
              </div>
            </div>
            <button
              onClick={handleConnectWallet}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                account
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-sm">
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
              </span>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-black/10"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl backdrop-blur-sm ${
                  message.type === "user"
                    ? "bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 text-white"
                    : "bg-black/40 border border-white/10 text-gray-100"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-black/40 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 text-green-400 animate-spin" />
                  <span className="text-sm text-gray-300">Analyzing market data...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 p-6 bg-black/20 backdrop-blur-xl">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for trading signals, market analysis, or execute trades..."
              className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 text-sm"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 text-white p-3 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Examples: "Get RSI signal for WETH" • "Buy 0.1 WETH" • "Analyze my portfolio" • "What's the best strategy for Bitcoin?"
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingChat; 