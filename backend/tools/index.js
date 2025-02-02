import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";
import { tool } from "ai";


export const createFoundryUpTools = (tokenBalance) => ({
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
      console.log("balances json in backend : ", tokenBalance)
      return tokenBalance
    },
  }),
});