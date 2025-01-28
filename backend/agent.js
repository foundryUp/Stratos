import dotenv from "dotenv";
dotenv.config();

import { SYSTEM_PROMPT } from "./config/prompt.js";
import { createPublicClient, createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { createNaniTools } from "./tools/index.js";
import { openai } from "@ai-sdk/openai";
import {createOpenAI as createGroq} from '@ai-sdk/openai'
import { generateText } from "ai";

const groq = createGroq({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

let PRIVATE_KEY = process.env.PRIVATE_KEY;
console.log("Private Key:", PRIVATE_KEY);
if (!PRIVATE_KEY) {
  PRIVATE_KEY = generatePrivateKey();
  console.log("Generated Private Key:", PRIVATE_KEY);
}
const account = privateKeyToAccount(PRIVATE_KEY);
console.log("Agent Address: ", account.address);
const walletClient = createWalletClient({
  account,
  chain: mainnet, //change to eth
  transport: http(),
});
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(`https://rpc.ankr.com/eth/${process.env.ANKR_API_KEY}`),
});
const tools = createNaniTools({
  account,
  walletClient,
  publicClient,
});

const { text } = await generateText({
  model: groq('llama3-8b-8192'),
  maxSteps: 10,
  system: SYSTEM_PROMPT,
  tools,
  prompt:
    "i have some tokens give me insights on trading them i dont have a high risk apetite so kepe that in mind",
  onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
    if (toolCalls[0]?.toolName) {
      console.log(`[${toolCalls[0].toolName}]`, toolResults[0]?.result);
    }
  },
});
console.log("Output:", text);
console.log("typeof:", typeof text);
let response = text + " uniswap";
console.log("response:", response);
console.log("typeof:", typeof response);
