import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  X,
  Camera,
  Loader,
  Sparkles,
  Command,
  MessageSquare,
  Zap,
  Hash,
  Globe,
  Bot,
  LineChart,
} from "lucide-react";
import Spline from "@splinetool/react-spline";
import {
  connectWallet,
  fetchTokenBalances,
  returnIntentValuesFromGeneral,
  giveWeth,
  handleTokensApprove,
  commandToGeneral,
  approveAAVEInteractor,
  handleATokenApproveTrading,
  handleApproveFromTokenToSwap
} from "../utils/web3functions";

const GeneralAI = () => {
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "👋 Hi there! I'm your AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [inputPrompt, setInputPrompt] = useState("");
  const [outputPrompt, setOutputPrompt] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [contractABI, setContractABI] = useState("");
  const [account, setAccount] = useState("");
  const [tokenName, setTokenName] = useState("");


  const [aiResponse, setAiResponse] = useState("");
  // New state variables matching the Solidity return types:
  const [commandValue, setCommandValue] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tradeAmount, setTradeAmount] = useState(null);
  const [protocol, setProtocol] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [balances, setBalances] = useState({});

  // Auto-scroll the chat container when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleConnectWallet = async () => {
    try {
      const { account } = await connectWallet();
      setAccount(account);
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  const handleSend = async () => {
    console.log("handleSend triggered with input:", input);

    let balancesObj = {};
    try {
      balancesObj = await fetchTokenBalances(account);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }

    if (!input.trim()) {
      console.warn("Input is empty");
      return;
    }

    // Add current user message to chat
    const updatedMessages = [...messages, { type: "user", content: input }];
    setMessages(updatedMessages);

    // Special "confirm" input triggers trade execution
    if (input.toLowerCase() === "confirm") {
      console.log("AI Response:", aiResponse);
      if (tradeAmount && isApproved) {
        try {
          // Command to process the trade; you might extend this to pass new parameters
          await commandToGeneral(aiResponse);
        } catch (error) {
          console.error("Trade command failed:", error);
        }
      }
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Please wait for transaction to be done...." },
      ]);
      return;
    }

    setInput("");
    setIsLoading(true);

    // Convert chat messages to a serialized prompt
    const prompt = updatedMessages
      .map(
        (msg) => `${msg.type === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    try {
      const response = await fetch("http://localhost:5000/api/generalchat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt, // sending the entire chat history
          balances: balancesObj,
        }),
      });

      const data = await response.json();
      console.log("Response from backend:", data);

      if (!response.ok || !data.response) {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: "Servers are busy. Please try again in 30 seconds.",
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Save AI response and add it to the chat
      setAiResponse(data.response);
      setMessages((prev) => [...prev, { type: "bot", content: data.response }]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "Something went wrong. Try again." },
      ]);
    }

    setIsLoading(false);
  };

  const simulateTyping = async (message) => {
    setIsLoading(true);
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 500)
    );
    setIsLoading(false);
    setMessages((prev) => [...prev, { type: "bot", ...message }]);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMessages([
      {
        type: "bot",
        content:
          "👋 Hi there! I'm your AI assistant. How can I help you today?",
      },
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (!tradeAmount || !tokenAddress || !commandValue) {
      console.error("Error in !tradeAmount || !tokenAddress || !commandValue !! :", error);
    }

    const cmd = commandValue.toLowerCase();

    let approveFn;
    let targetArg;

    if (cmd === "deposit") {
      approveFn = approveAAVEInteractor;
      targetArg = tokenAddress;
    } 
    else if (cmd === "withdraw") {
      if(tokenName==""){
        console.error("Error in fetching simple name from ai response! :", error);
      }
      approveFn = handleATokenApproveTrading;
      targetArg = tokenName;
    }
    else if (cmd === "swap") {
      approveFn = handleApproveFromTokenToSwap;
      targetArg = protocol;
    }
    
    // else if (cmd === "sendtoaddress") {
    //   approveFn = handleApproveFromTokenToSwap;
    //   targetArg = protocol;
    // }

    approveFn(tradeAmount, targetArg)
      .then((approved) => {
        if (approved) setIsApproved(true);
      })
      .catch((error) => {
        console.error("Error approving tokens:", error);
      });
  }, [tradeAmount]);

  // Parse the AI response using returnIntentValues to extract command details
  useEffect(() => {
    if (aiResponse) {
      console.log("aiResponse updated, calling returnIntentValues");
      const words = aiResponse.trim().toLowerCase().split(" ");
      setTokenName(words[1]);
      returnIntentValuesFromGeneral(aiResponse)
        .then((response) => {
          // Expecting: [command, token, amount, protocol]
          setCommandValue(response[0]);
          setTokenAddress(response[1]);
          setTradeAmount(response[2]);
          setProtocol(response[3]);
        })
        .catch((error) => {
          console.error("Error in returnIntentValues:", error);
        });
    }
  }, [aiResponse]);

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
                <br />
                <button
                  onClick={giveWeth}
                  className="flex w-full space-x-4 p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Get WETH for testing
                </button>
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
