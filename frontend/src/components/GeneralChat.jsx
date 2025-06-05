import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader,
} from "lucide-react";
import Spline from "@splinetool/react-spline";
import {
  connectWallet,
  fetchTokenBalances,
  commandToSimpleIE,
} from "../utils/web3functions";
import { verifyContracts } from "../utils/contractVerification";
import config from "../config/config";

const GeneralAI = () => {
  const chatContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "👋 Hi there! I'm your AI assistant. I can help you send tokens or swap tokens. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [account, setAccount] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [balances, setBalances] = useState({});
  const [contractStatus, setContractStatus] = useState(null);

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
        { type: "bot", content: "Please connect your wallet first." },
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

      // Use config for backend URL
      const NODE_BACKEND_URL = config.NODE_BACKEND_URL;

      // Call backend API for general chat
      const response = await fetch(`${NODE_BACKEND_URL}/api/generalchat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      console.log("🟢 Frontend - Response from backend:", data);

      if (!data.response) {
        throw new Error("Invalid response from server");
      }

      console.log("🟢 Frontend - Raw AI response:", data.response);
      console.log("🟢 Frontend - AI response type:", typeof data.response);

      // Parse the command from the response
      let commandObj;
      try {
        commandObj = JSON.parse(data.response);
        console.log("🟢 Frontend - Parsed command object:", commandObj);
        console.log("🟢 Frontend - Command from AI:", commandObj.command);
      } catch (error) {
        console.error("🟢 Frontend - Error parsing command:", error);
        console.error("🟢 Frontend - Failed to parse this response:", data.response);
        throw new Error("Invalid command format from server");
      }
      
      if (!commandObj || !commandObj.command) {
        throw new Error("Invalid command format from server");
      }

      // Add AI response to chat
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: `I'll help you with that. Executing command: ${commandObj.command}` },
      ]);

      // Execute the command
      console.log("Executing command:", commandObj.command);
      const tx = await commandToSimpleIE(commandObj.command);
      console.log("Transaction result:", tx);
      
      // Add success message
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Transaction executed successfully! 🎉" },
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
      }

      setMessages((prev) => [
        ...prev,
        { type: "bot", content: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyContracts = async () => {
    try {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "🔍 Verifying contract deployments..." },
      ]);
      
      const result = await verifyContracts();
      setContractStatus(result);
      
      if (result.success) {
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: "✅ All contracts verified successfully! You can now send tokens and make swaps." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: `❌ Contract verification failed: ${result.error}. Please check if Anvil is running and contracts are deployed.` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: `❌ Verification error: ${error.message}` },
      ]);
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
                  AI-Powered • Real-Time • Intelligent
                </p>
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-7xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500 animate-gradient-x">
                Intent
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-indigo-300">
                AI
              </span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto font-light">
              Experience seamless crypto solutions with Intent AI Chatbot – your
              ultimate cryptocurrency companion today!
            </p>
          </div>

          {/* Spline Container */}
          <div className="relative w-full h-[500px]">
            <Spline scene="https://prod.spline.design/6cBpFzCL5rJzFnLv/scene.splinecode" />
          </div>
        </div>
      </div>

      {/* Right Side - Chat Interface */}
      <div className="w-1/2 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10">
              {/* Chat header and wallet controls */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-sm"></div>
                      <div className="relative w-12 h-12 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                        <span className="text-2xl">🤖</span>
                      </div>
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-lg">
                        AI Assistant
                      </h2>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <p className="text-white/60 text-sm">Online & Ready</p>
                      </div>
                    </div>
                  </div>
                </div>
                {!account && (
                  <div className="flex w-full space-x-4">
                    <button
                      onClick={handleConnectWallet}
                      className="flex-grow p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )}
                {account && (
                  <div className="flex w-full space-x-2">
                    <button
                      onClick={handleVerifyContracts}
                      className="flex-grow p-2 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl text-white font-medium hover:opacity-90 transition-opacity text-sm"
                    >
                      🔍 Verify Contracts
                    </button>
                  </div>
                )}
              </div>

              {/* Chat messages */}
              <div
                ref={chatContainerRef}
                className="h-[400px] overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent"
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    } animate-fade-in-up`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl backdrop-blur-sm ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-none"
                          : "bg-white/5 text-white rounded-bl-none border border-white/10"
                      }`}
                    >
                      <p className="leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center space-x-2 text-white/60">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                )}
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-white/10">
                <div className="relative group/input">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover/input:opacity-50 transition duration-500"></div>
                  <div className="relative flex space-x-3">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything..."
                      rows="1"
                      className="flex-1 p-3 bg-black/50 backdrop-blur-xl text-white placeholder-white/40 border border-white/10 rounded-2xl focus:outline-none focus:border-white/20 resize-none transition-all duration-300"
                      style={{
                        height: "48px",
                        minHeight: "48px",
                        maxHeight: "120px",
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

export default GeneralAI;
