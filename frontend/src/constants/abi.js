// Contract addresses from environment variables
// These will be set in Vercel after deploying contracts
export const TradeContractAddress = process.env.REACT_APP_TRADE_CONTRACT_ADDRESS || "0x7c28FC9709650D49c8d0aED2f6ece6b191F192a9";
export const AAVE_Interactor_Contract = process.env.REACT_APP_AAVE_CONTRACT_ADDRESS || "0x244dE6b06E7087110b94Cde88A42d9aBA17efa52";
export const SEND_SWAP_CONTRACT = process.env.REACT_APP_SEND_SWAP_CONTRACT_ADDRESS || "0xa7E99C1df635d13d61F7c81eCe571cc952E64526";

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

export const TradeABI = [
  {"type":"fallback","stateMutability":"payable"},
  {"type":"receive","stateMutability":"payable"},
  {"type":"function","name":"commandToTrade","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"nonpayable"},
  {"type":"function","name":"getAddressFromString","inputs":[{"name":"tokenName","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},
  {"type":"function","name":"returnIntentValues","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"view"},
  {"type":"error","name":"InvalidCharacter","inputs":[]},
  {"type":"error","name":"InvalidSyntax","inputs":[]}
];

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
]
