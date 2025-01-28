export const TradeABI = [{"type":"fallback","stateMutability":"payable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"commandToTrade","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"nonpayable"},{"type":"function","name":"getAddressFromString","inputs":[{"name":"tokenName","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"returnIntentValues","inputs":[{"name":"intent","type":"string","internalType":"string"}],"outputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"},{"name":"protocol","type":"string","internalType":"string"}],"stateMutability":"view"},{"type":"error","name":"InvalidCharacter","inputs":[]},{"type":"error","name":"InvalidSyntax","inputs":[]}]
export const TradeContractAddress  = "0xEd8D7d3A98CB4ea6C91a80dcd2220719c264531f" 
export const ERC20ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool);"
  ];
export const WETH_ABI = [
    "function deposit() public payable",
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
];