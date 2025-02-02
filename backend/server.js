import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { SYSTEM_PROMPT } from "./config/prompt.js";
import { createFoundryUpTools } from "./tools/index.js";
import { generateText } from "ai";
import { createOpenAI as createGroq } from '@ai-sdk/openai';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies

// API endpoint to handle requests from the frontend
app.post("/api/generate-insights", async (req, res) => {
  try {
    
    const { prompt, balances } = req.body; // Get the prompt from the frontend
    console.log("balance backedn 1 : , ", balances)
    const tools = createFoundryUpTools({
      balances
    });

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    const groq = createGroq({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: process.env.GROQ_API_KEY,
    });

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
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



/**======================
 *    Fetching Data Test
 *========================**/

// const getData  =  async (pairAddress) => {
//   const poolAddress = pairAddress;
//   const url = `https://api.dexscreener.com/latest/dex/pairs/ethereum/${poolAddress}`;

//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error("Network response was not ok " + response.statusText);
//     }
//     const data = await response.json();
//     console.log(data.pair); // Process your data here //Change this as it gives more detailed Data**
//     return data.pair;
//   } catch (error) {
//     console.error("Fetch error: ", error);
//   }
// }

// getData("0x231B7589426Ffe1b75405526fC32aC09D44364c4")
// console.log("======================================")
// getData("0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc")
// console.log("======================================")

// getData("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11")
// console.log("======================================")

// getData("0xBb2b8038a1640196FbE3e38816F3e67Cba72D940")
