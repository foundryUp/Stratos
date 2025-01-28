// import dotenv from "dotenv"
// dotenv.config()

// import { SYSTEM_PROMPT } from "./config/prompt.js";
// import { createPublicClient, createWalletClient, http } from "viem";
// import { arbitrum, mainnet } from "viem/chains";
// import { createNaniTools } from "./tools/index.js";
// import { openai } from "@ai-sdk/openai";
// import { generateText } from "ai";
// import { OpenAI} from "openai"
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Camera, Loader, Sparkles, Command, MessageSquare, Zap, Hash, Globe, Bot, LineChart } from 'lucide-react';
import Spline from '@splinetool/react-spline';
import { TradeABI, TradeContractAddress, ERC20ABI ,WETH_ABI} from '../constants/abi';
import { ethers } from 'ethers';
// import {model} from '../../../backend/agent.js'
// import { sign } from 'viem/accounts';

const IntentAI = () => {
  const chatContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [firstPrompt,setFirstPrompt] = useState('')
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "📈 Welcome to the Trading Assistant! I can help you with market analysis, trading strategies, and more."
    }
  ]);
const [test,setTest]=useState("");
  const [account, setAccount] = useState("");
  const [message, setMessage] = useState("");
  // const [amount, setAmount] = useState("");
  const [targetChain, setTargetChain] = useState("");
  const [provider, setProvider] = useState(null); // Store the provider
  const [signer, setSigner] = useState(null); // Store the signer
  const [inputPrompt, setInputPrompt] = useState("");
  const [input, setInput] = useState("");

  const [outputPrompt, setOutputPrompt] = useState(""); //4 words
  const [contractAddress, setContractAddress] = useState('');
  const [contractABI, setContractABI] = useState('');
  const [transactionSucceeded, settransactionSucceeded] = useState(false);
  const [airesponse, setairesponse] = useState('')
  const [amountTotrade, setAmountToTrade] = useState(null)
  const [addressfirstTokenToTrade, setaddressfirstTokenToTrade] = useState(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider); // Store the provider
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        const signer = await provider.getSigner();
        setSigner(signer); // Store the signer
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask is not installed!");
    }
  };

  const returnIntentValuesOnStart = async function(){

    const contract = new ethers.Contract(TradeContractAddress, TradeABI, signer);

    try {
      const response = await contract.returnIntentValues(airesponse);

      console.log("token 1:",response[0])
      console.log("token 2:",response[1])
      console.log("amount:",response[2])
      setAmountToTrade(response[2])
      setaddressfirstTokenToTrade(response[0])

      console.log("protocol",response[3])
    } catch (error) {
      console.error("Error calling returnIntentValues:", error);
    }

  } 

  const giveWeth = async () => {
    try {
      // Check if the user has a wallet connected
      if (!window.ethereum) {
        throw new Error("Metamask is not installed");
      }
  
      // Request wallet access
      const wethContract = new ethers.Contract("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", WETH_ABI, signer);
      console.log(wethContract)
      console.log(signer)
      // Convert the amount to wei (18 decimals)
      
  
      // Step 1: Wrap ETH into WETH by calling `deposit`
      const depositTx = await wethContract.deposit({ value: ethers.parseEther("10") });
      console.log("Depositing ETH to WETH...");
      // await depositTx.wait();
  
      console.log("Transferring WETH to recipient...");
      // const receipt = await transferTx.wait();
  
      // console.log("WETH successfully sent!", receipt);
      if(depositTx){
        const balance = await wethContract.balanceOf(account);
        console.log("weth balance : ",balance)
      }

      // return receipt;
    } catch (error) {
      console.error("Error giving WETH to user:", error);
      throw error;
    }
  }
  
  const handleCommandToTrade = async () => {
 
    // const contract = new ethers.Contract(TradeContractAddress, TradeABI, signer);

    
    // const tokenContract = new ethers.Contract(`${addressfirstTokenToTrade}`, ERC20ABI, signer);
    // const userAddress = await signer.getAddress();
    // if (userAddress) {
    //   const balance = await tokenContract.balanceOf(signer.getAddress());
    //   await tokenContract.approve(address(contract), amount)

    //   if(balance < amount) {
    //     alert("Insufficient balance");
    //     return;
    //   }
    // }

    // const tx = await contract.commandToTrade(airesponse, { value: amount });

    // console.log("Transaction sent! Hash:", tx.hash);

    // await tx.wait();

    // console.log("transaction confirmed");


  }

  useEffect(()=>{
    if(amountTotrade){
      handleCommandToTrade()
    }
  },[amountTotrade])

  const handleSend = async () => {
    if (!input.trim()) return;
  
    // Add user input to messages
    setMessages((prev) => [...prev, { type: 'user', content: input }]);
  
    // Set the first prompt and clear the input field
    setFirstPrompt(input);
    console.log("input : ", input);
    setInput('');
  
    try {
      const response = await fetch("http://localhost:5000/api/generate-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt : input }), // Send the prompt to the backend
      });
  
      const data = await response.json();
      console.log("Response from backend:", data);
      return data.response; // Return the generated insights
    } catch (error) {
      console.error("Error fetching insights:", error);
      return null;
    }


  };

  useEffect(()=>{
    

    if(airesponse){
      console.log("Starting transaction ....");
      returnIntentValuesOnStart();
    }

  },[airesponse])
  

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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

      {/* Left Side - Updated Spline Section */}
      <div className="w-1/2 p-8 flex flex-col items-center justify-center relative">
        <div className="text-center space-y-8 relative z-10 max-w-3xl">
          {/* Header Badge */}
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <p className="text-sm text-white/70">AI-Powered • Real-Time • Intelligent</p>
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
              Experience seamless crypto solutions with Intent AI Chatbot – your ultimate cryptocurrency companion today!
            </p>
          </div>

          {/* Updated Spline Container */}
          <div className="relative w-full h-[500px]">
            <Spline scene="https://prod.spline.design/31iD8MVkM1IpbbeX/scene.splinecode" />
          </div>
        </div>
      </div>
      {/* Right Side - Chat Interface - Same as before */}
      <div className="w-1/2 p-6 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>

            <div className="relative bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10">
              {/* Chat header and tabs */}
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
                      <h2 className="font-bold text-white text-lg">AI Assistant</h2>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <p className="text-white/60 text-sm">Online & Ready</p>
                      </div>
                    </div>
                  </div>
                </div>


              </div>

              {/* Chat messages */}
              <div
                ref={chatContainerRef}
                className="h-[400px] overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent"
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'
                      } animate-fade-in-up`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl backdrop-blur-sm ${message.type === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-none'
                        : 'bg-white/5 text-white rounded-bl-none border border-white/10'
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
                      placeholder={activeTab === 'general' ? "Ask me anything..." : "Ask about trading..."}
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
                <br></br>
                <button onClick={connectWallet} >Connet Wallet!</button>
                <br></br>
                <br></br>
                <button onClick={giveWeth}>Give fukcing weth!!</button>
                <br></br>
                <br></br>
                <button onClick={handleCommandToTrade}> Click MFs !!!!!!!</button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default IntentAI;