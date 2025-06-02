export const TradeContractAddress  = "0x2C56932223cdE0D363266f1308c48Ff1BF9F9041"
export const AAVE_Interactor_Contract = "0x2C56932223cdE0D363266f1308c48Ff1BF9F9041"
export const GeneralContractAddress = "0x91c8C745fd156d8624677aa924Cdc1Ef8173C69C"
export const SEND_SWAP_CONTRACT = "0xFae8bf5E0bCBdcc44f3E13966C8c3F16917463bE"
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

export const WETH_ABI = [
    {
      "constant": false,
      "inputs": [],
      "name": "deposit",
      "outputs": [],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        { "name": "guy", "type": "address" },
        { "name": "wad", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [{ "name": "", "type": "bool" }],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        { "name": "owner", "type": "address" },
        { "name": "spender", "type": "address" }
      ],
      "name": "allowance",
      "outputs": [{ "name": "", "type": "uint256" }],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        { "name": "account", "type": "address" }
      ],
      "name": "balanceOf",
      "outputs": [
        { "name": "", "type": "uint256" }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
];
export const TradeABI = [{"type":"fallback","stateMutability":"payable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"commandToTrade","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"nonpayable"},{"type":"function","name":"getAddressFromString","inputs":[{"name":"tokenName","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"returnIntentValues","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"error","name":"InvalidCharacter","inputs":[]},{"type":"error","name":"InvalidSyntax","inputs":[]}]
export const GeneralABI = [{"type":"constructor","inputs":[{"name":"_compoundManager","type":"address","internalType":"address"},{"name":"_aave_core","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"fallback","stateMutability":"payable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"commandToTrade","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"nonpayable"},{"type":"function","name":"compoundManager","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ICompoundETHManager"}],"stateMutability":"view"},{"type":"function","name":"getAAVEAddressFromString","inputs":[{"name":"tokenName","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"getAddressFromString","inputs":[{"name":"tokenName","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"hexStringToAddress","inputs":[{"name":"s","type":"string","internalType":"string"}],"outputs":[{"name":"addr","type":"address","internalType":"address"}],"stateMutability":"pure"},{"type":"function","name":"returnIntentValues","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"command","type":"string","internalType":"string"},{"name":"token","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"error","name":"InvalidCharacter","inputs":[]},{"type":"error","name":"InvalidSyntax","inputs":[]}]
export const SEND_SWAP_ABI =[{"type":"fallback","stateMutability":"payable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"addresses","inputs":[{"name":"name","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"command","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"names","inputs":[{"name":"addresses","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"function","name":"pairs","inputs":[{"name":"token0","type":"address","internalType":"address"},{"name":"token1","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"send","inputs":[{"name":"to","type":"string","internalType":"string"},{"name":"amount","type":"string","internalType":"string"},{"name":"token","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"payable"},{"type":"function","name":"swap","inputs":[{"name":"amountIn","type":"string","internalType":"string"},{"name":"amountOutMin","type":"string","internalType":"string"},{"name":"tokenIn","type":"string","internalType":"string"},{"name":"tokenOut","type":"string","internalType":"string"},{"name":"receiver","type":"string","internalType":"string"}],"outputs":[],"stateMutability":"payable"},{"type":"error","name":"InsufficientSwap","inputs":[]},{"type":"error","name":"InvalidCharacter","inputs":[]},{"type":"error","name":"InvalidSwap","inputs":[]},{"type":"error","name":"InvalidSyntax","inputs":[]},{"type":"error","name":"Overflow","inputs":[]}]