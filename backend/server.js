import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { SYSTEM_PROMPT } from "./config/prompt.js";
import { createPublicClient, createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { createNaniTools } from "./tools/index.js";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createOpenAI as createGroq } from '@ai-sdk/openai';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies

// Initialize wallet and tools
let PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  PRIVATE_KEY = generatePrivateKey();
  console.log("Generated Private Key:", PRIVATE_KEY);
}
const account = privateKeyToAccount(PRIVATE_KEY);
console.log("Agent Address: ", account.address);

const walletClient = createWalletClient({
  account,
  chain: mainnet, // Change to Ethereum mainnet
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

// API endpoint to handle requests from the frontend
app.post("/api/generate-insights", async (req, res) => {
  try {
    const { prompt } = req.body; // Get the prompt from the frontend

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const groq = createGroq({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: process.env.GROQ_API_KEY,
      });

      const { text } = await generateText({
        model: groq('llama-3.1-405b-reasoning'),
        prompt: 'What is love?',
      });

    console.log("Output:", text);
    let response = text + " uniswap"; // Modify the response as needed
    console.log("Response:", response);

    // Send the response back to the frontend
    res.json({ response });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});