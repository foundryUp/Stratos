import React, { useState } from "react";
import {
  BookOpen,
  Code,
  Coins,
  MessagesSquare,
  Wallet,
  ArrowRight,
  Github,
  Terminal,
  Globe,
} from "lucide-react";

const Documentation = () => {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = {
    overview: {
      title: "Project Overview",
      content: (
        <div className="space-y-4">
          <p>
            IntentAI is a decentralised chatbot application that offers a
            next-generation AI assistant that combines advanced conversational
            abilities with powerful tools for quant trading, providing users
            with intelligent, real-time responses, personalized insights, and
            strategies, available 24/7 to enhance productivity, trading, and
            decision-making.
          </p>
          <br></br>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <MessagesSquare className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">Chatbot Interface</h3>
              </div>
              <p className="text-sm text-white/70">
                Natural language processing interface for user interactions
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">Smart Contracts</h3>
              </div>
              <p className="text-sm text-white/70">
                Solidity contracts for DeFi protocol interactions.
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">Quant Trading</h3>
              </div>
              <p className="text-sm text-white/70">
                Trading using advance Quantitative algorithms.
              </p>
            </div>
          </div>
        </div>
      ),
    },

    architecture: {
      title: "System Architecture",
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-4">Component Structure</h3>

          <div className="space-y-6">
            <div className="p-4 bg-black/20 rounded-xl border border-white/10">
              <h4 className="font-medium mb-2">Frontend Components</h4>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Trading Chat Interface (tradingchat.jsx)</li>
                <li>Compound Integration (generalchat.jsx)</li>
                <li>Documentation Page (documentation.jsx)</li>
                <li>Shared UI Components (Spline components)</li>
              </ul>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/10">
              <h4 className="font-medium mb-2">Smart Contracts</h4>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>
                  CompoundIntents.sol - Main contract for Compound interactions
                </li>
                <li>CompoundETHManager2.sol - ETH management logic</li>
                <li>Trading contract integrations</li>
              </ul>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-white/10">
              <h4 className="font-medium mb-2">Backend Services</h4>
              <ul className="list-disc list-inside space-y-2 text-white/70">
                <li>Intent Processing API</li>
                <li>Web3 Integration Services</li>
                <li>Natural Language Processing Pipeline</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },

    smartContracts: {
      title: "Smart Contracts",
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-black/20 rounded-xl border border-white/10">
            <h3 className="font-medium mb-4">CompoundIntents Contract</h3>
            <p className="mb-4 text-white/70">
              Main contract for processing user intents and interacting with
              Compound protocol.
            </p>

            <h4 className="font-medium mb-2">Key Functions:</h4>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>command(string calldata intent) - Process user commands</li>
              <li>_deposit(uint256 amount) - Handle ETH deposits</li>
              <li>_withdraw(uint256 amount) - Process withdrawals</li>
            </ul>
          </div>

          <div className="p-4 bg-black/20 rounded-xl border border-white/10">
            <h3 className="font-medium mb-4">Contract Addresses</h3>
            <div className="space-y-2 text-white/70">
              <p>
                cETH Address (Mainnet):
                0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5
              </p>
              <p>
                cETH Address (Goerli):
                0x64078a6189Bf45f80091c6Ff2fCEe1B15Ac8dbde
              </p>
            </div>
          </div>
        </div>
      ),
    },

    usage: {
      title: "Usage Guide",
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-black/20 rounded-xl border border-white/10">
            <h3 className="font-medium mb-4">Compound Interactions</h3>
            <p className="mb-4 text-white/70">
              Example commands for Compound protocol interactions:
            </p>

            <div className="space-y-2">
              <div className="p-2 bg-black/30 rounded-lg">
                <code>deposit 0.1 ETH</code> - Deposit ETH into Compound
              </div>
              <div className="p-2 bg-black/30 rounded-lg">
                <code>withdraw 0.05 ETH</code> - Withdraw ETH from Compound
              </div>
            </div>
          </div>

          <div className="p-4 bg-black/20 rounded-xl border border-white/10">
            <h3 className="font-medium mb-4">Trading Commands</h3>
            <p className="mb-4 text-white/70">Example commands for trading:</p>

            <div className="space-y-2">
              <div className="p-2 bg-black/30 rounded-lg">
                <code>swap 0.1 WETH to DAI</code>
              </div>
              <div className="p-2 bg-black/30 rounded-lg">
                <code>trade ETH for DAI</code>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    setup: {
      title: "Setup Guide",
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-black/20 rounded-xl border border-white/10">
            <h3 className="font-medium mb-4">Prerequisites</h3>
            <ul className="list-disc list-inside space-y-2 text-white/70">
              <li>Node.js v16 or higher</li>
              <li>Foundry Setup</li>
              <li>MetaMask or compatible Web3 wallet</li>
              <li>Access to Ethereum network (Mainnet or Testnet)</li>
            </ul>
          </div>

          <div className="p-4 bg-black/20 rounded-xl border border-white/10">
            <h3 className="font-medium mb-4">Installation Steps</h3>
            <div className="space-y-2">
              <div className="p-2 bg-black/30 rounded-lg">
                <code>
                  git clone https://github.com/foundryUp/AI-Quant-Trader
                </code>
              </div>
              <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                <h3 className="font-medium mb-4">Frontend setup</h3>
                <div className="space-y-2">
                  <div className="p-2 bg-black/30 rounded-lg">
                    <code>cd ./frontend/</code>
                  </div>
                  <div className="p-2 bg-black/30 rounded-lg">
                    <code>npm i</code>
                  </div>
                  <div className="p-2 bg-black/30 rounded-lg">
                    <code>npm run dev</code>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                <h3 className="font-medium mb-4">Fork the anvil chain locally using the RPC URL</h3>
                <div className="space-y-2">
                  <div className="p-2 bg-black/30 rounded-lg">
                    <code>anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo</code>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                <h3 className="font-medium mb-4">Deploy smart contracts IntentEngineTrade.sol</h3>
                <div className="space-y-2">
                  <div className="p-2 bg-black/30 rounded-lg">
                    <code>forge script script/DeployTradeIntent.sol:DeployTradeIntent --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="min-h-screen bg-[#0a0014] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2a1f3f2e_1px,transparent_1px),linear-gradient(to_bottom,#2a1f3f2e_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              IntentAI Documentation
            </span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Complete documentation for the IntentAI project, including
            architecture, smart contracts, and usage guides.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {Object.entries(sections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeSection === key
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                  : "bg-white/5 hover:bg-white/10 text-white/70"
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6">
            {sections[activeSection].title}
          </h2>
          {sections[activeSection].content}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/50 text-sm">
          <div className="flex items-center justify-center space-x-4">
            <a
              href="#"
              className="hover:text-white transition-colors duration-200 flex items-center space-x-2"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors duration-200 flex items-center space-x-2"
            >
              <Globe className="w-4 h-4" />
              <span>Website</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
