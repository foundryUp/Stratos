import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader,
} from "lucide-react";
import Spline from "@splinetool/react-spline";
import {
  connectWallet,
  fetchTokenBalances,
  returnIntentValuesFromGeneral,
  giveWeth,
  commandToGeneral,
  approveAAVEInteractor,
  handleATokenApproveTrading,
  handleApproveFromTokenToSwap,
} from "../utils/web3functions";

const GeneralAI = () => {
  const chatContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "👋 Hi there! I'm your AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [account, setAccount] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  // Parsed command details
  const [commandValue, setCommandValue] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [tradeAmount, setTradeAmount] = useState(null);
  const [protocol, setProtocol] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [balances, setBalances] = useState({});

  // Auto-scroll chat container
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

    // Add user's message to chat
    const updatedMessages = [...messages, { type: "user", content: input }];
    setMessages(updatedMessages);

    // Check for "confirm" input
    if (input.toLowerCase() === "confirm") {
      console.log("AI Response:", aiResponse);
      // If not approved yet, perform the approval process
      if (!isApproved) {
        let approveFn;
        let targetArg;
        const cmd = commandValue.toLowerCase();
        console.log(
          `Processing command: ${cmd} for token: ${tokenAddress} with amount: ${tradeAmount}`
        );

        if (cmd === "deposit") {
          approveFn = approveAAVEInteractor;
          targetArg = tokenAddress;
        } else if (cmd === "withdraw") {
          if (!tokenName) {
            console.error("Missing tokenName for withdraw operation");
            setMessages((prev) => [
              ...prev,
              {
                type: "bot",
                content: "Missing token name for withdrawal operation.",
              },
            ]);
            setIsLoading(false);
            return;
          }
          approveFn = handleATokenApproveTrading;
          targetArg = tokenName;
        } else if (cmd === "swap") {
          approveFn = handleApproveFromTokenToSwap;
          targetArg = protocol;
        } else {
          console.error(`Unrecognized command: ${cmd}`);
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: "Unrecognized command. Please try again.",
            },
          ]);
          setIsLoading(false);
          return;
        }

        try {
          const approved = await approveFn(tradeAmount, targetArg);
          if (approved) {
            setIsApproved(true);
            setMessages((prev) => [
              ...prev,
              {
                type: "bot",
                content:
                  "Approval confirmed. Please type 'confirm' again to execute the trade.",
              },
            ]);
            setIsLoading(false);
            return;
          } else {
            console.error("Approval failed");
            setMessages((prev) => [
              ...prev,
              { type: "bot", content: "Approval failed. Please try again." },
            ]);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error during token approval:", error);
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: "Error during token approval. Please try again.",
            },
          ]);
          setIsLoading(false);
          return;
        }
      } else {
        // If already approved, execute the trade command
        try {
          await commandToGeneral(aiResponse);
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content:
                "Transaction executed successfully. Please wait for confirmation.",
            },
          ]);
        } catch (error) {
          console.error("Trade command failed:", error);
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content: "Trade command failed. Please try again.",
            },
          ]);
        }
        setIsLoading(false);
        return;
      }
    }

    setInput("");
    setIsLoading(true);

    // Create a prompt from the conversation history
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

      // Save and display the AI response
      setAiResponse(data.response);
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: data.response },
      ]);
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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Parse the AI response to extract command details
  useEffect(() => {
    if (aiResponse) {
      console.log("aiResponse updated, calling returnIntentValues");
      // Use only the first line of the AI response for parsing
      const sanitizedResponse = aiResponse.split("\n")[0].trim();
      const words = sanitizedResponse.toLowerCase().split(" ");
      setTokenName(words[1] || "");
      returnIntentValuesFromGeneral(sanitizedResponse)
        .then((response) => {
          console.log("Parsed response:", response);
          // Expecting: [command, token, amount, protocol]
          setCommandValue(response[0] || "");
          setTokenAddress(response[1] || "");
          setTradeAmount(response[2] || null);
          setProtocol(response[3] || "");
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
