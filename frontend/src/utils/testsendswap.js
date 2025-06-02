// scripts/swap_weth_for_dai.js
import Web3 from "web3";
import {
  ERC20ABI,
  SEND_SWAP_ABI,
  SEND_SWAP_CONTRACT,
} from "../constants/abi.js";

/* ─── hard-coded WETH main-net address ─── */
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

async function main() {
  /* 1. connect to your fork */
  const web3 = new Web3("http://127.0.0.1:8545");         // Hardhat/Anvil fork
  const [signer] = await web3.eth.getAccounts();

  /* 2. approval: 0.5 WETH to SimpleIE */
  const amountEth = "0.5";
  const amountWei = web3.utils.toWei(amountEth, "ether");

  const weth = new web3.eth.Contract(ERC20ABI, WETH_ADDRESS);
  console.log(`Approving ${amountEth} WETH…`);
  await weth.methods
    .approve(SEND_SWAP_CONTRACT, amountWei)
    .send({ from: signer });
  console.log("✅  approval done");

  /* 3. run the swap */
  const ie  = new web3.eth.Contract(SEND_SWAP_ABI, SEND_SWAP_CONTRACT);
  const cmd = `swap ${amountEth} weth for dai`;
  console.log("Executing DSL:", cmd);

  const tx = await ie.methods.command(cmd).send({
    from: signer,
    gas: 500_000,
  });

  console.log("✔  swap tx hash:", tx.transactionHash);
}

main().catch((err) => {
  console.error("❌  script failed:", err);
  process.exit(1);
});
