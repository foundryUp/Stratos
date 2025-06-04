import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { SEND_SWAP_PROMPT, DEFI_AAVE_PROMPT, TRADING_PROMPT } from "./config/prompt.js";
import { createFoundryUpTools } from "./tools/index.js";
import { generateText } from "ai";
import { groq } from '@ai-sdk/groq';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies

app.get("/health", (req, res) => {
  res.send("Server is running successfully...");
});

// New API endpoint for general AI chat without tools
app.post("/api/generalchat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      maxSteps: 10,
      system: SEND_SWAP_PROMPT,
      prompt,
    });

    console.log("General Chat Output:", text);
    res.json({ response: text });
  } catch (error) {
    console.error("Error generating general chat response:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// New API endpoint for DeFi chat with Aave protocol
app.post("/api/defichat", async (req, res) => {
  try {
    const { prompt, balances, account } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      maxSteps: 10,
      system: DEFI_AAVE_PROMPT,
      prompt: `User account: ${account}\nUser balances: ${JSON.stringify(balances)}\nUser request: ${prompt}`,
    });

    console.log("DeFi Chat Output:", text);
    res.json({ response: text });
  } catch (error) {
    console.error("Error generating DeFi chat response:", error);
    res.status(500).json({ error: "Failed to generate DeFi response" });
  }
});

// New API endpoint for Trading chat with algorithmic analysis
app.post("/api/tradingchat", async (req, res) => {
  try {
    const { prompt, balances, account } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      maxSteps: 10,
      system: TRADING_PROMPT,
      prompt: `User account: ${account}\nUser balances: ${JSON.stringify(balances)}\nUser request: ${prompt}`,
    });

    console.log("Trading Chat Output:", text);
    
    // Parse the AI response
    let responseObj;
    try {
      responseObj = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      return res.status(500).json({ error: "Invalid response format from AI" });
    }

    // If it's a command that needs to interact with Python backend
    if (responseObj.command) {
      const command = responseObj.command;
      console.log("Processing trading command:", command);

      // Handle signal commands - fetch from Python backend
      if (command.startsWith('signal ')) {
        const parts = command.split(' ');
        if (parts.length === 4) {
          const [, pair, term, risk] = parts;
          try {
            // Use environment variable for Python backend URL, fallback to localhost for development
            const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5049';

            // Fetch signal from Python backend using unified endpoint
            const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/decisions/${pair}/${term}/${risk}`);
            if (!pythonResponse.ok) {
              throw new Error(`Python backend error: ${pythonResponse.status}`);
            }
            
            const signalData = await pythonResponse.json();
            console.log("Signal data from Python backend:", signalData);
            
            return res.json({ 
              response: JSON.stringify({ 
                signal: signalData,
                message: `Here's the ${term}-term ${risk}-risk trading signal for ${pair.toUpperCase().replace('_', '/')}:`
              }) 
            });
            
          } catch (pythonError) {
            console.error("Error fetching from Python backend:", pythonError);
            return res.json({ 
              response: JSON.stringify({ 
                message: "Unable to fetch trading signals at the moment. Please ensure the Python trading servers are running." 
              }) 
            });
          }
        }
      }
      
      // Handle analyze commands
      if (command.startsWith('analyze ')) {
        const parts = command.split(' ');
        if (parts.length === 2) {
          const target = parts[1];
          
          if (target === 'portfolio') {
            return res.json({ 
              response: JSON.stringify({ 
                analysis: {
                  balances: balances,
                  account: account,
                  timestamp: new Date().toISOString()
                },
                message: "Here's your current portfolio analysis:"
              }) 
            });
          } else {
            // Market analysis for specific pair
            const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5049';
            
            try {
              const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/health`);
              if (pythonResponse.ok) {
                const healthData = await pythonResponse.json();
                return res.json({ 
                  response: JSON.stringify({ 
                    analysis: healthData,
                    message: `Here's the current system status for trading algorithms:`
                  }) 
                });
              }
            } catch (error) {
              console.error("Error fetching system data:", error);
            }
          }
        }
      }
      
      // Handle trade commands - pass through as is for frontend to execute
      if (command.startsWith('trade ')) {
        return res.json({ 
          response: JSON.stringify({ 
            command: command,
            message: "I'll help you execute this trade. Please confirm the transaction in your wallet."
          }) 
        });
      }
    }

    // For message responses or other cases
    res.json({ response: text });
    
  } catch (error) {
    console.error("Error generating trading response:", error);
    res.status(500).json({ error: "Failed to generate trading response" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on PORT => ${PORT}`);
});