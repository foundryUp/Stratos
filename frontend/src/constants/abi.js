export const TradeContractAddress  = "0x88777418972fB3F58489303d763d4DaF398A6527"
export const GeneralContractAddress = "0x222D74f33b0d07687a769A44399E2272A4cB9FfE"
export const AAVE_Interactor_Contract = "0xdA796117bF6905DD8DB2fF1ab4397f6d2c4ADda3"
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
        { "name": "to", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ],
      "name": "transfer",
      "outputs": [
        { "name": "", "type": "bool" }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
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