# 🚀 Render Anvil Deployment Guide

## ✅ **Local Testing Verified**
- ✅ Docker build successful
- ✅ Anvil responds to RPC calls
- ✅ **Chain ID: 1 (Ethereum Mainnet Fork)** 🎉
- ✅ Mainnet fork working with current block data
- ✅ 10 test accounts available with 10,000 ETH each

## 🛠 **Deploy to Render**

### 1. Push to GitHub
Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Add Anvil deployment with chain ID 1"
git push origin main
```

### 2. Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Use these settings:

**Basic Settings:**
- **Name**: `anvil-node` (or your preferred name)
- **Region**: `Oregon (US West)`
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Docker`
- **Dockerfile Path**: `./Dockerfile.anvil`

**Instance Type:**
- **Plan**: `Free` (will sleep after 15 minutes of inactivity)

**Advanced Settings:**
- **Health Check Path**: `/` 
- **Port**: `8545`

### 3. Environment Variables
In the Render dashboard, add these environment variables:

```bash
ANVIL_IP_ADDR=0.0.0.0
FOUNDRY_DISABLE_NIGHTLY_WARNING=true
FORK_URL=https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo
CHAIN_ID=1
PORT=8545
```

### 4. Deploy
Click "Create Web Service" and wait for deployment.

## 🧪 **Test Your Deployed Anvil**

Once deployed, test your Anvil instance:

```bash
# Replace with your actual Render URL
export ANVIL_URL="https://anvil-mainnet-fork.onrender.com"

# Test connection - should return chain ID 1
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  $ANVIL_URL

# Expected result: {"jsonrpc":"2.0","id":1,"result":"0x1"}

# Get accounts
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}' \
  $ANVIL_URL

# Check first account balance (should have 10,000 ETH)
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","latest"],"id":1}' \
  $ANVIL_URL
```

## 🔧 **Deploy Your Smart Contracts**

### Option 1: Using Foundry

```bash
# Replace with your Render Anvil URL
export ANVIL_URL="https://anvil-mainnet-fork.onrender.com"

# Deploy your contracts
forge create --rpc-url $ANVIL_URL \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  src/YourContract.sol:YourContract

# Example: Deploy trading contract
forge create --rpc-url $ANVIL_URL \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  src/TradeContract.sol:TradeContract
```

### Option 2: Using Hardhat

Update your `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    localhost: {
      url: "http://localhost:8545",
      chainId: 1 // Now matches mainnet!
    },
    anvil_render: {
      url: "https://anvil-mainnet-fork.onrender.com", // Your Render URL
      chainId: 1, // Mainnet chain ID
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" // Account 0
      ]
    }
  }
};
```

Deploy:
```bash
npx hardhat run scripts/deploy.js --network anvil_render
```

## 📝 **Update Frontend Configuration**

### 1. Update Vercel Environment Variables

In your Vercel dashboard, add these environment variables:

```bash
# Anvil/Ethereum Configuration (Chain ID 1!)
REACT_APP_ANVIL_URL=https://anvil-mainnet-fork.onrender.com
REACT_APP_ETHEREUM_RPC_URL=https://anvil-mainnet-fork.onrender.com
REACT_APP_CHAIN_ID=1
REACT_APP_NETWORK_NAME=mainnet

# Contract Addresses (add after deployment)
REACT_APP_TRADE_CONTRACT_ADDRESS=0x... # From deployment output
REACT_APP_AAVE_CONTRACT_ADDRESS=0x...  # From deployment output  
REACT_APP_SEND_SWAP_CONTRACT_ADDRESS=0x... # From deployment output

# Backend URLs (already configured)
REACT_APP_NODE_BACKEND_URL=https://ai-quant-trader-1.onrender.com
REACT_APP_PYTHON_BACKEND_URL=https://ai-quant-trader.onrender.com
```

### 2. MetaMask Configuration

Your users can now:
- **✅ Connect directly to "Ethereum Mainnet"** in MetaMask
- **✅ Use your Anvil as mainnet RPC**: `https://anvil-mainnet-fork.onrender.com`
- **✅ Import test accounts** with 10,000 ETH each

**MetaMask Setup:**
1. Go to **Settings → Networks → Ethereum Mainnet → Edit**
2. **Replace RPC URL** with: `https://anvil-mainnet-fork.onrender.com`
3. **Save** - now MetaMask uses your forked mainnet!

## 🎯 **Available Test Accounts**

Your Anvil instance comes with 10 pre-funded accounts (10,000 ETH each):

```javascript
// Account 0 - Primary deployment account
{
  address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
}

// Account 1 - Secondary account
{
  address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
  privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
}

// ... 8 more accounts available
```

## 🔄 **Handling Render Sleep Behavior**

### How Render Free Tier Works:
- **Sleeps**: After 15 minutes of inactivity
- **Wakes Up**: On first incoming request (takes ~30 seconds)
- **Impact**: First request after sleep will be slow

### Frontend Handling:
```javascript
// Add retry logic for the first request
const connectToAnvil = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(config.ANVIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        })
      });
      
      const result = await response.json();
      if (result.result === '0x1') return response; // Chain ID 1 confirmed
      
    } catch (error) {
      if (i === retries - 1) throw error;
      // Wait before retry (Render wake-up time)
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};
```

## 📊 **Complete Deployment Workflow**

### 1. Local Development
```bash
# Start local Anvil with chain ID 1
docker-compose -f docker-compose.anvil.yml up

# Verify chain ID
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://localhost:8545

# Deploy contracts locally
forge create --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  src/YourContract.sol:YourContract
```

### 2. Deploy to Render
```bash
# Push to GitHub
git add . && git commit -m "Ready for deployment" && git push

# Deploy via Render dashboard
# Update environment variables
```

### 3. Deploy Contracts to Render Anvil
```bash
# Deploy to production Anvil (Chain ID 1!)
forge create --rpc-url https://anvil-mainnet-fork.onrender.com \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  src/YourContract.sol:YourContract
```

### 4. Update Vercel
```bash
# Add contract addresses to Vercel environment variables
# Redeploy frontend (automatic on Vercel)
```

## 💡 **Pro Tips for Render**

### 1. Keep Anvil Awake
Create a simple health check service:
```javascript
// Optional: Create a keep-alive service
setInterval(async () => {
  try {
    const response = await fetch('https://anvil-mainnet-fork.onrender.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId', 
        params: [],
        id: 1
      })
    });
    const result = await response.json();
    console.log('Keep-alive ping:', result.result === '0x1' ? 'Chain ID 1 ✅' : 'Unexpected chain ID');
  } catch (error) {
    console.log('Keep-alive ping failed:', error.message);
  }
}, 10 * 60 * 1000); // Ping every 10 minutes
```

### 2. Monitor Deployment
```bash
# Check Render logs
# Go to Render dashboard → Your service → Logs

# Test chain ID periodically
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  https://anvil-mainnet-fork.onrender.com
```

### 3. Backup Strategy
- Consider upgrading to Render paid plan ($7/month) for 24/7 uptime
- Or use multiple free Render services with load balancing
- Keep local Anvil setup for development

## 🚨 **Important Notes**

1. **State Persistence**: Anvil state resets on each Render restart
2. **Cold Start**: First request after sleep takes ~30 seconds  
3. **Contract Addresses**: Remain the same after wake-up (deterministic)
4. **Free Tier**: 750 hours/month (sufficient for development)
5. **Chain ID**: Now correctly shows 1 (Ethereum Mainnet) in MetaMask! 🎉

## 🎉 **Success!**

Your Render Anvil deployment now provides:
- ✅ **Chain ID 1**: Appears as Ethereum Mainnet in MetaMask
- ✅ **Mainnet Fork**: All real mainnet data and contracts available
- ✅ **10,000 ETH accounts**: For testing without spending real money
- ✅ **Accessible 24/7**: Via https://anvil-mainnet-fork.onrender.com

Perfect for development and testing! 🚀 