forge script script/DeployTradeIntent.sol:DeployIntentEngine --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast

anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo

python3 -m Python.Decisions.RSI_server



forge script script/DeployAaveInteractorV3.sol --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast


forge script script/deploy-send-swap-ie.sol --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast


forge script script/DeployTradeIntent.sol --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast


cat out/send-swap-ie.sol/SimpleIE.json | jq '.abi' > frontend/src/abi/SimpleIE.json

cat out/aave_core.sol/AaveV3Interactor.json | jq '.abi' > aave_abi_temp.json
