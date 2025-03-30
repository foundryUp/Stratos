import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { SYSTEM_PROMPT_TRADE,SYSTEM_PROMPT_GENERAL } from "./config/prompt.js";
import { createFoundryUpTools } from "./tools/index.js";
import { generateText } from "ai";
import { createOpenAI as createGroq } from "@ai-sdk/openai";
import { PythonShell } from "python-shell";
import { spawn } from "child_process";

// PythonShell.run('./Python/Decisions/RSI_.js', null, (err, results) => {
//   if (err) throw err;
//   console.log('Python says:', results.join('\n'));
// });


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Parse JSON request bodies

app.get("/health", (req, res) => {
  res.send("Server is running successfully...");
});

// API endpoint to handle trading insights requests
app.post("/api/generate-insights", async (req, res) => {
  try {
    const { prompt, balances } = req.body;
    console.log("Balance backend 1:", balances);

    const tools = createFoundryUpTools({ balances });

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
      system: SYSTEM_PROMPT_TRADE,
      tools,
      prompt,
      onStepFinish({ toolCalls, toolResults }) {
        if (toolCalls[0]?.toolName) {
          console.log(`[${toolCalls[0].toolName}]`, toolResults[0]?.result);
        }
      },
    });

    console.log("Output:", text);
    res.json({ response: text });
  } catch (error) {
    console.error("Error generating insights:", error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// New API endpoint for general AI chat without tools
app.post("/api/generalchat", async (req, res) => {
  try {
    const { prompt } = req.body;

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
      system: SYSTEM_PROMPT_GENERAL,
      prompt,
    });

    console.log("General Chat Output:", text);
    res.json({ response: text });
  } catch (error) {
    console.error("Error generating general chat response:", error);
    res.status(500).json({ error: "Failed to generate response" });
  }
});



app.get('/python', (req, res) => {
  // Spawn a Python process with the '-m' flag to run the module
  const pythonProcess = spawn('python', ['-m', 'hello']);

  let output = '';

  // Collect data from the Python process stdout
  pythonProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  // Handle any errors
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python error: ${data}`);
  });

  // When the Python process closes, send the output as the response
  pythonProcess.on('close', (code) => {
    res.send(`Python process exited with code ${code}. Output: ${output}`);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on PORT => ${PORT}`);
});