import time
from ..Algorithms.RSI import rsi_strategy_decision
from ..SubGraph.weth_usdc import fetch_graph_data_weth_usdc
from ..SubGraph.wbtc_usdc import fetch_graph_data_wbtc_usdc
from ..SubGraph.dai_usdc import fetch_graph_data_dai_usdc
import json
from dotenv import load_dotenv
import os
from groq import Groq
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))  # New Groq client

SYSTEM_PROMPT = """You are an expert trading AI specializing in low-risk cryptocurrency 
strategies. Analyze the RSI data and provide only BUY/SELL/HOLD decisions considering:
- Current market conditions
- Low risk tolerance
- Historical price patterns
- Volatility indicators"""

def get_llm_decision(algo_result):
    """
    Modified for Groq API with risk-averse strategy
    """
    user_prompt = f"""
    Trading Context:
    - RSI Strategy Suggestion: {algo_result['decision']}
    - Current RSI: {algo_result['rsi']}
    - Latest Price: {algo_result['latest_price']}
    - Recent Prices: {algo_result['price_series'][-5:]}

    Required Action: For a LOW-RISK strategy, should we BUY, SELL, or HOLD?
    Respond with ONLY the action word in uppercase.
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            model="llama3-70b-8192",
            temperature=0.3,
            max_tokens=3  # Allowing up to 3 tokens to avoid truncation
        )
        return chat_completion.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        return "HOLD"  # Fail-safe default
    
def rsi_decision_loop():
    """
    Executes once per API call and returns JSON-formatted decisions.
    """
    print("\n--- RSI Decision Execution ---")
    decisions = {}

    # Process all trading pairs
    for pair, fetch_fn in [
        ("BTC", fetch_graph_data_wbtc_usdc),
        ("DAI", fetch_graph_data_dai_usdc),
        ("WETH", fetch_graph_data_weth_usdc)
    ]:
        graph_data = fetch_fn()
        if not graph_data:
            decisions[pair] = {"action": "HOLD", "position_size": 0, "reason": "No data"}
            continue

        algo_result = rsi_strategy_decision(
            graph_data,
            rsi_period=5,
            overbought_threshold=70,
            oversold_threshold=30
        )
        print(algo_result)
        if algo_result.get("decision") in ("NO_DATA", "INSUFFICIENT_DATA"):
            print(algo_result.get("decision"))
            decisions[pair] = {"action": "HOLD", "position_size": 0, "reason": "Insufficient data"}
            continue

        try:
            llm_decision = get_llm_decision(algo_result)

            # Dynamically calculate position size (example logic)
            position_size = max(10, min(100, 100 - algo_result["rsi"]))

            decisions[pair] = {
                "action": llm_decision,
                "position_size": position_size,
                "rsi": algo_result['rsi'],
                "price": algo_result['latest_price']
            }

        except Exception as e:
            decisions[pair] = {"action": "HOLD", "position_size": 0, "reason": str(e)}

    # Create final JSON output
    output_json = {
        "timestamp": int(time.time()),
        "decisions": decisions
    }

    print("Final Output:", json.dumps(output_json, indent=2))
    return output_json  # Returning JSON instead of running indefinitely
