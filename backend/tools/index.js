import dotenv from "dotenv";
dotenv.config();
import Moralis from "moralis";
import { AnkrProvider } from "@ankr.com/ankr.js";
import { z } from "zod";
import { tool } from "ai";
import { http } from "viem";

if (!process.env.ANKR_API_KEY) {
  throw new Error("ANKR_API_KEY environment variable must be set");
}

const provider = new AnkrProvider(
  `https://rpc.ankr.com/multichain/${process.env.ANKR_API_KEY}`
);

// const ZEROX_API_URL = "https://arbitrum.api.0x.org";

export const createNaniTools = ({ account, walletClient, publicClient }) => ({
  getLiquidityPoolPrice: tool({
    description: "Get liquidity pool price using Moralis",
    parameters: z.object({
      pairAddress: z.string().describe("Address of the liquidity pool pair"),
    }),
    execute: async ({ pairAddress }) => {
      const poolAddress = pairAddress;
      const url = `https://api.dexscreener.com/latest/dex/pairs/ethereum/${poolAddress}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        const data = await response.json();
        console.log(data.pair); // Process your data here //Change this as it gives more detailed Data**
        return data.pair;
      } catch (error) {
        console.error("Fetch error: ", error);
      }
    },
  }),

  getBalance: tool({
    description: "Check token balances with current prices",
    parameters: z.object({}),
    execute: async () => {
      try {
        const [address] = await walletClient.getAddresses();
        const response = await provider.getAccountBalance({
          blockchain: "eth",
          walletAddress: address,
          onlyWhitelisted: false,
        });
        if (!response) {
          throw new Error("Failed to fetch balance");
        }
        return response;
      } catch (error) {
        console.error("Error fetching balance:", error);
        return { error: error.message || "An unknown error occurred" };
      }
    },
  }),
});
