# Vercel Deployment Guide

## 🚀 Deploy AI Quant Trader to Vercel

### Prerequisites
- ✅ Remote Anvil instance running at `https://anvil-mainnet-fork.onrender.com`
- ✅ Python and Node backend servers deployed
- ✅ Foundry/Forge installed locally for contract deployment

### Step 1: Deploy Contracts to Remote Anvil

First, deploy all contracts to your remote Anvil instance:

```bash
# Set the remote Anvil URL
export ANVIL_RPC_URL="https://anvil-mainnet-fork.onrender.com"

# Deploy contracts
./redeploy-contracts.sh
```

**Note the deployed contract addresses from the output!**

### Step 2: Set Up Vercel Environment Variables

In your Vercel dashboard, add these environment variables:

#### Required Environment Variables:
```
REACT_APP_TRADE_CONTRACT_ADDRESS=0x[TradingEngine_Address_From_Deployment]
REACT_APP_AAVE_CONTRACT_ADDRESS=0x[AaveV3Interactor_Address_From_Deployment]
REACT_APP_SEND_SWAP_CONTRACT_ADDRESS=0x[SimpleIE_Address_From_Deployment]
REACT_APP_ANVIL_RPC_URL=https://anvil-mainnet-fork.onrender.com
```

#### Backend URLs (if you have them deployed):
```
REACT_APP_NODE_BACKEND_URL=https://your-node-backend.onrender.com
REACT_APP_PYTHON_BACKEND_URL=https://your-python-backend.onrender.com
```

### Step 3: Update Frontend Configuration

Your frontend is already configured to use environment variables. The contract verification will automatically use the remote Anvil URL.

### Step 4: Deploy to Vercel

#### Option A: Via Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add REACT_APP_TRADE_CONTRACT_ADDRESS
vercel env add REACT_APP_AAVE_CONTRACT_ADDRESS
vercel env add REACT_APP_SEND_SWAP_CONTRACT_ADDRESS
vercel env add REACT_APP_ANVIL_RPC_URL
```

#### Option B: Via Vercel Dashboard
1. Connect your GitHub repository to Vercel
2. Set the environment variables in Project Settings > Environment Variables
3. Deploy automatically on push

### Step 5: Verify Deployment

Once deployed:

1. **Test Contract Verification**:
   - Open your deployed app
   - Connect wallet
   - Click "🔍 Verify Contracts" in both Trading and General Assistant
   - Should show "✅ All contracts verified successfully!"

2. **Test Functionality**:
   - **General Assistant**: Try sending ETH and ERC20 tokens
   - **Trading Assistant**: Generate signals and execute trades
   - **DeFi Assistant**: Test Aave operations

### Example Contract Deployment Output

When you run `./redeploy-contracts.sh`, you'll see something like:

```
🚀 Deploying contracts to Remote Anvil...
🌐 Using RPC URL: https://anvil-mainnet-fork.onrender.com
✅ Remote Anvil is accessible
📦 Deploying contracts to remote Anvil...

=== DEPLOYMENT SUMMARY ===
TradingEngine (Trading Assistant): 0xNewTradingEngineAddress
AaveV3Interactor (DeFi Assistant): 0xNewAaveInteractorAddress  
SimpleIE (General Assistant): 0xNewSimpleIEAddress
```

Use these addresses in your Vercel environment variables.

### Environment Variables Template

Create a `.env.example` file for reference:

```env
# Contract Addresses (Update with actual deployed addresses)
REACT_APP_TRADE_CONTRACT_ADDRESS=0x37692DFD92BA53f447f37D916B23187D7CE40405
REACT_APP_AAVE_CONTRACT_ADDRESS=0x9D40c21ff3BD14d671BB7c00Dcc1aDD0a4C9Bd41
REACT_APP_SEND_SWAP_CONTRACT_ADDRESS=0x876D514e8dEA31fBd5AE8b5847c22A8Dff6511D5

# Network Configuration
REACT_APP_ANVIL_RPC_URL=https://anvil-mainnet-fork.onrender.com

# Backend URLs (Update with your deployed URLs)
REACT_APP_NODE_BACKEND_URL=https://your-node-backend.onrender.com
REACT_APP_PYTHON_BACKEND_URL=https://your-python-backend.onrender.com
```

### Troubleshooting

#### If contracts fail to deploy:
1. Check if remote Anvil is accessible: `curl https://anvil-mainnet-fork.onrender.com`
2. Verify the private key is correct
3. Check if Anvil has enough ETH for deployment

#### If verification fails in production:
1. Check environment variables are set correctly in Vercel
2. Check browser console for detailed error messages
3. Verify contract addresses match deployment output

#### If transactions fail:
1. Make sure users are connected to the correct network
2. Check if contracts have sufficient approvals
3. Verify gas limits are appropriate for the network

### Network Configuration

The app will automatically:
- Use remote Anvil RPC URL from environment variables
- Fall back to `https://anvil-mainnet-fork.onrender.com` if not set
- Work with MetaMask if users have the network configured

### Post-Deployment Checklist

- [ ] Contracts deployed to remote Anvil
- [ ] Environment variables set in Vercel
- [ ] Frontend deployed and accessible
- [ ] Contract verification working
- [ ] All three assistants functional
- [ ] Backend APIs responding correctly
- [ ] User wallet connections working

Your AI Quant Trader is now ready for production use! 🎉 