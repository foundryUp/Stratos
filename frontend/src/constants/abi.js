// Contract addresses from local Anvil deployment
export const TradingEngineAddress = process.env.REACT_APP_TRADE_CONTRACT_ADDRESS;
export const AAVE_Interactor_Contract = process.env.REACT_APP_AAVE_CONTRACT_ADDRESS ;
export const SEND_SWAP_CONTRACT = process.env.REACT_APP_SEND_SWAP_CONTRACT_ADDRESS ;

export const ERC20ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// TradingEngine ABI - Updated from compiled contract
export const TradingEngineABI = [
  {"type":"constructor","inputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"UNISWAP_V2_ROUTER","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"USDC","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"WETH","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"buyToken","inputs":[{"name":"tokenSymbol","type":"string","internalType":"string"},{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"minAmountOut","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"emergencyWithdraw","inputs":[{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"getExpectedOutput","inputs":[{"name":"tokenSymbol","type":"string","internalType":"string"},{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"isBuy","type":"bool","internalType":"bool"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"getTokenAddress","inputs":[{"name":"symbol","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"sellToken","inputs":[{"name":"tokenSymbol","type":"string","internalType":"string"},{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"minAmountOut","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"tokenRegistry","inputs":[{"name":"","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"updateTokenRegistry","inputs":[{"name":"symbol","type":"string","internalType":"string"},{"name":"tokenAddress","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"event","name":"TradeExecuted","inputs":[{"name":"user","type":"address","indexed":true,"internalType":"address"},{"name":"tokenIn","type":"address","indexed":true,"internalType":"address"},{"name":"tokenOut","type":"address","indexed":true,"internalType":"address"},{"name":"amountIn","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"amountOut","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"tradeType","type":"string","indexed":false,"internalType":"string"}],"anonymous":false},
  {"type":"error","name":"InvalidAmount","inputs":[]},
  {"type":"error","name":"Reentrancy","inputs":[]},
  {"type":"error","name":"SlippageTooHigh","inputs":[]},
  {"type":"error","name":"TransferFailed","inputs":[]},
  {"type":"error","name":"UnsupportedToken","inputs":[]}
];

// Updated AaveV3Interactor ABI from compiled contract
export const AAVE_ABI = [
  {"type":"constructor","inputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"borrow","inputs":[{"name":"asset","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"interestRateMode","type":"uint256","internalType":"uint256"},{"name":"user","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"deposit","inputs":[{"name":"asset","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"user","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"pool","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IPool"}],"stateMutability":"view"},
  {"type":"function","name":"repay","inputs":[{"name":"asset","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"rateMode","type":"uint256","internalType":"uint256"},{"name":"user","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},
  {"type":"function","name":"userDeposits","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},
  {"type":"function","name":"withdraw","inputs":[{"name":"asset","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"user","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"}
];

// Updated SimpleIE (Send/Swap) ABI from compiled contract
export const SEND_SWAP_ABI = [
  {"type":"fallback","stateMutability":"payable"},
  {"type":"receive","stateMutability":"payable"},
  {"type":"function","name":"addresses","inputs":[{"name":"name","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"command","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"payable"},
  {"type":"function","name":"names","inputs":[{"name":"addresses","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"function","name":"pairs","inputs":[{"name":"token0","type":"address","internalType":"address"},{"name":"token1","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"send","inputs":[{"name":"to","type":"string","internalType":"string"},{"name":"amount","type":"string","internalType":"string"},{"name":"token","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"payable"},
  {"type":"function","name":"swap","inputs":[{"name":"amountIn","type":"string","internalType":"string"},{"name":"amountOutMin","type":"string","internalType":"string"},{"name":"tokenIn","type":"string","internalType":"string"},{"name":"tokenOut","type":"string","internalType":"string"},{"name":"receiver","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"payable"},
  {"type":"error","name":"InsufficientSwap","inputs":[]},
  {"type":"error","name":"InvalidCharacter","inputs":[]},
  {"type":"error","name":"InvalidSwap","inputs":[]},
  {"type":"error","name":"InvalidSyntax","inputs":[]},
  {"type":"error","name":"Overflow","inputs":[]}
];
