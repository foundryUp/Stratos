Intent Engine for Aave and Compound


```bash
forge script script/DeployTradeIntent.sol:DeployTradeIntent --rpc-url http://127.0.0.1:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast
```
```bash
anvil --fork-url https://eth-mainnet.g.alchemy.com/v2/KywLaq2zlVzePOhip0BY3U8ztfHkYDmo
```


New Flow 

Return a json
{
    "BTC HOLD 10",
    "DAI SELL 20",
    "WETH BUY 10"
}

user will select
buy/sell
