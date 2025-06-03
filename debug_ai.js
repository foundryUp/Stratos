import dotenv from "dotenv";
dotenv.config();

import { generateText } from "ai";
import { groq } from '@ai-sdk/groq';

const SEND_SWAP_PROMPT = `You are an intent parser that only understands two actions—sending tokens and swapping tokens—and must always output exactly one JSON object with a single key, "command", whose value is the DSL string.

Types you will see:
• amount / amountIn: a positive decimal (e.g. "0.1", "100") or the literal "all"
• token / tokenIn / tokenOut: either a known symbol (e.g. "eth", "usdc", "dai") or a 0x-prefixed 42-byte address
• recipient: a 0x-prefixed 42-byte address

Rules:
1. If the user wants to send tokens, output:
   send <amount> <token> <recipient>
2. If the user wants to swap tokens, output one of:
   swap <amountIn> <tokenIn> for <tokenOut>
   or (with custom receiver)
   swap <amountIn> <tokenIn> for <tokenOut> to <recipient>
3. Never output anything else—no explanation, no markdown, no extra fields, just:
   { "command": "…" }

Examples:
User: "Please send 50 USDC to 0xAbC1234567890abcdef1234567890ABCDef1234"
Output:
{"command":"send 50 usdc 0xAbC1234567890abcdef1234567890ABCDef1234"}

User: "Swap 0.5 weth for dai"
Output:
{"command":"swap 0.5 weth for dai"}

Now parse the next input and return the JSON only.`;

async function testAI() {
  try {
    console.log("🧪 Testing AI with send command...");
    
    const testPrompt = "send 1 eth to 0x742d35Cc6634C0532925a3b8D02468f7a8E7ECA9";
    
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      maxSteps: 10,
      system: SEND_SWAP_PROMPT,
      prompt: testPrompt,
    });

    console.log("User Input:", testPrompt);
    console.log("AI Output:", text);
    
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(text);
      console.log("Parsed JSON:", parsed);
      console.log("Command:", parsed.command);
    } catch (e) {
      console.log("❌ Failed to parse as JSON:", e.message);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testAI(); 