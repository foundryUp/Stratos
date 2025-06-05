#!/bin/bash

echo "🚀 Deploying contracts to Remote Anvil..."

# Set the RPC URL - use environment variable or default to remote Anvil
ANVIL_RPC_URL=${ANVIL_RPC_URL:-"https://anvil-mainnet-fork.onrender.com"}
echo "🌐 Using RPC URL: $ANVIL_RPC_URL"

# Check if Anvil is running
if ! curl -s "$ANVIL_RPC_URL" > /dev/null; then
    echo "❌ Anvil is not running at $ANVIL_RPC_URL"
    echo "Please check your remote Anvil deployment"
    exit 1
fi

echo "✅ Remote Anvil is accessible"

# Deploy all contracts
echo "📦 Deploying contracts to remote Anvil..."
forge script script/DeployAll.sol --rpc-url "$ANVIL_RPC_URL" --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

if [ $? -eq 0 ]; then
    echo "✅ Contracts deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Check the deployment output above for contract addresses"
    echo "2. Update frontend/src/constants/abi.js with the new addresses if they changed"
    echo "3. Test the contracts using the 'Verify Contracts' button in the UI"
    echo ""
    echo "🔍 Current addresses in abi.js:"
    echo "TradingEngine: $(grep 'TradingEngineAddress' frontend/src/constants/abi.js)"
    echo "AaveInteractor: $(grep 'AAVE_Interactor_Contract' frontend/src/constants/abi.js)"
    echo "SimpleIE: $(grep 'SEND_SWAP_CONTRACT' frontend/src/constants/abi.js)"
else
    echo "❌ Contract deployment failed!"
    echo "Please check the error messages above"
    exit 1
fi 