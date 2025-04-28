# Intent Engine Protocol

An on-chain “intent engine” for EVM chains, powered by a local Anvil node. Turn natural-language chat commands into token transfers, DeFi actions, and automated trading strategies—all in one modular framework.

---

## Table of Contents

- [Overview](#overview)  
- [Key Features](#key-features)  
- [Architecture](#architecture)  
- [Components](#components)  
- [Getting Started](#getting-started)  
  - [Prerequisites](#prerequisites)  
  - [Clone & Install](#clone--install)  
  - [Start Local Chain (Anvil)](#start-local-chain-anvil)  
  - [Compile & Deploy](#compile--deploy)  
- [Usage](#usage)  
  - [Chat Interface](#chat-interface)  
  - [Direct Contract Calls](#direct-contract-calls)  
- [Development & Testing](#development--testing)  
- [License](#license)  

---

## Overview

The **Intent Engine Protocol** lets users interact with smart contracts via simple chat prompts. Behind the scenes, an off-chain NLP hub parses your intent and crafts a transaction that executes on an EVM chain. Running locally on Anvil for development, it’s easy to extend and test.

---

## Key Features

- **Natural-Language Interface**: Chat to send tokens, swap, lend, borrow, or run trading strategies.  
- **Modular “Assistants”**: Three core assistants—General, DeFi, Trading—plus room to plug in new modules.  
- **On-Chain Execution**: All intents produce real transactions; nothing happens off-chain.  
- **Quant Strategies Built-In**: Low- and high-risk trading strategies (MA crossover, DCA, MACD, RSI).

---

## Architecture

```plaintext
┌─────────────────────┐
│   Web / CLI UI      │   ← Type “Send 1 ETH to 0x…”  
└─────────────────────┘
            ↓
┌────────────────────────────────────────────┐
│        Off-Chain Intent Hub (Node.js)     │
│ • NLP parsing                              │
│ • Strategy sizing                          │
│ • Tx builder & signer                      │
└────────────────────────────────────────────┘
            ↓
┌────────────────────────────────────────────┐
│         On-Chain Contracts (Forge)        │                   │
└────────────────────────────────────────────┘
            ↓
┌─────────────────────┐
│    Local Anvil      │   ← EVM node at http://127.0.0.1:8545  
└─────────────────────┘
```

---

## Components

### 1. General Assistant (`GeneralAssistant.sol`)
- **Send ETH/ERC-20** to any address  
- **Swap** via integrated DEX (Uniswap)  
- **Cross-chain transfer** (in progress)

---

### 2. DeFi Assistant (`DeFiAssistant.sol`)
- **Deposit/Withdraw** on Aave & Compound  
- **Borrow/Repay** assets  
- **Query** collateral ratios, health factors

---

### 3. Trading Assistant (`TradingAssistant.sol`)
Fetches your on-chain balances, computes trade sizes, and executes orders:

| Strategy                        | Risk | Logic                                       |
|---------------------------------|------|---------------------------------------------|
| Short-Term Low-Risk             | Low  | Moving Average Crossover                    |
| Long-Term Low-Risk              | Low  | Dollar-Cost Averaging                       |
| Long-Term High-Risk             | High | MACD (Moving Avg. Convergence Divergence)   |
| Short-Term High-Risk            | High | RSI-based entry/exit                        |

---

## Getting Started

### Prerequisites

- **Foundry** (forge & anvil) installed:  
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
- **Node.js** ≥ 16 & **Yarn** (for the off-chain hub)  
- An EVM wallet private key for signing (local only)

---

### Clone & Install

```bash
git clone https://github.com/your-org/intent-engine.git
cd intent-engine
yarn install
```

---

### Start Local Chain (Anvil)

In one terminal, run:
```bash
anvil --chain-id 31337 --port 8545
```
This spins up a local EVM node at `http://127.0.0.1:8545` with unlocked accounts.

---

### Compile & Deploy

1. **Compile** contracts with Forge:
   ```bash
   forge build
   ```
2. **Deploy** to Anvil:
   ```bash
   forge script scripts/Deploy.s.sol \
     --rpc-url http://127.0.0.1:8545 \
     --broadcast \
     --private-key <ANVIL_ACCOUNT_PRIVATE_KEY>
   ```
   Note the deployed addresses in the output.

3. **Configure** the off-chain hub:
   ```bash
   cp .env.example .env
   # set RPC_URL=http://127.0.0.1:8545
   # set CONTRACT_ADDRESSES as deployed
   ```

---

## Usage

### Chat Interface

1. Start the off-chain hub:
   ```bash
yarn start
```
2. Open `http://localhost:3000` (or CLI)  
3. Enter commands like:
   ```
   Send 1 ETH to 0xAbC…1234
   Deposit 50 DAI on Compound
   Run long-term high-risk on my ETH balance
   ```

---

### Direct Contract Calls

You can also invoke intents directly via a script or REPL:

```js
import { ethers } from "ethers";
import { IntentHub } from "./hub";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const signer = provider.getSigner(0);
  const hub = new IntentHub(provider, signer, {
    general: "0x…",
    defi:    "0x…",
    trading: "0x…"
  });

  // Send 0.1 ETH
  await hub.general.send("0xAbC…1234", ethers.utils.parseEther("0.1"));
}
main();
```

---

## Development & Testing

- **Branching**: off `develop`  
- **Tests**:  
  ```bash
  forge test
  ```


## License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for details.

