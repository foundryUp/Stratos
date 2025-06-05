#!/bin/bash

echo "🚀 Deploying contracts to Remote Anvil for Vercel..."

# Remote Anvil Configuration
REMOTE_ANVIL_URL="https://anvil-mainnet-fork.onrender.com"
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo "🌐 Target Network: $REMOTE_ANVIL_URL"
echo "🔑 Using default Anvil private key"

# Check if remote Anvil is accessible
echo "🔍 Checking remote Anvil accessibility..."
if ! curl -s -o /dev/null -w "%{http_code}" "$REMOTE_ANVIL_URL" | grep -q "200\|404"; then
    echo "❌ Remote Anvil is not accessible at $REMOTE_ANVIL_URL"
    echo "Please check if your Anvil instance is running on Render"
    exit 1
fi

echo "✅ Remote Anvil is accessible"

# Deploy contracts
echo "📦 Deploying all contracts..."
echo "This may take a few minutes depending on network latency..."

forge script script/DeployAll.sol \
    --rpc-url "$REMOTE_ANVIL_URL" \
    --private-key "$DEPLOYER_PRIVATE_KEY" \
    --broadcast \
    --slow \
    --legacy

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📝 NEXT STEPS FOR VERCEL:"
    echo "1. Copy the contract addresses from the deployment output above"
    echo "2. Go to your Vercel dashboard > Project Settings > Environment Variables"
    echo "3. Add these environment variables:"
    echo ""
    echo "   REACT_APP_ANVIL_RPC_URL=https://anvil-mainnet-fork.onrender.com"
    echo "   REACT_APP_TRADE_CONTRACT_ADDRESS=[TradingEngine address from output]"
    echo "   REACT_APP_AAVE_CONTRACT_ADDRESS=[AaveV3Interactor address from output]"
    echo "   REACT_APP_SEND_SWAP_CONTRACT_ADDRESS=[SimpleIE address from output]"
    echo ""
    echo "4. Redeploy your Vercel app"
    echo "5. Test using the 'Verify Contracts' button in the UI"
    echo ""
    echo "🔗 Remote Anvil URL: $REMOTE_ANVIL_URL"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Common issues:"
    echo "- Remote Anvil might be down or restarting"
    echo "- Network connectivity issues"
    echo "- Insufficient gas or ETH in deployer account"
    echo ""
    echo "Try running the script again in a few minutes"
    exit 1
fi 