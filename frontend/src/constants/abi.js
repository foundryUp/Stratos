export const TradeABI = [{"type":"fallback","stateMutability":"payable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"commandToTrade","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"nonpayable"},{"type":"function","name":"getAddressFromString","inputs":[{"name":"tokenName","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"returnIntentValues","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"error","name":"InvalidCharacter","inputs":[]},{"type":"error","name":"InvalidSyntax","inputs":[]}]
export const TradeContractAddress  = "0xa86582Ad5E80abc19F95f8A9Fb3905Cda0dAbd59" 
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
  