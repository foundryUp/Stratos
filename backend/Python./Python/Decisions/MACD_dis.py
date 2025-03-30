import time
import json
from datetime import datetime
from ..SubGraph.weth_usdc import fetch_graph_data_weth_usdc
from ..SubGraph.wbtc_usdc import fetch_graph_data_wbtc_usdc
from ..SubGraph.dai_usdc import fetch_graph_data_dai_usdc
from ..Algorithms.MACD import macd_strategy_decision
from dotenv import load_dotenv
import os
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))  # New Groq client

def get_llm_decision(algo_result):
    prompt = f"""
    The MACD-based strategy suggests: {algo_result['decision']}.
    Latest MACD: {algo_result['macd']}
    Latest Signal: {algo_result['signal']}
    Latest Price: {algo_result['latest_price']}

    Do we BUY, SELL, or HOLD?
    Respond with only one word: BUY, SELL, or HOLD.
    """
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-70b-8192",
        temperature=0.3,
        max_tokens=3
    )
    return chat_completion.choices[0].message.content.strip()

def fetch_and_analyze():
    pools = {
        "BTC": fetch_graph_data_wbtc_usdc,
        "DAI": fetch_graph_data_dai_usdc,
        "WETH": fetch_graph_data_weth_usdc
    }
    
    decisions = {}
    for asset, fetch_data in pools.items():
        print(f"Fetching data for {asset}...")
        graph_data = fetch_data()
        
        if not graph_data:
            decisions[asset] = {
                "action": "HOLD",
                "position_size": 0,
                "reason": "No data available"
            }
            continue

        algo_result = macd_strategy_decision(graph_data)
        print(f"MACD Algorithm Output for {asset}:", algo_result)
        
        if algo_result.get("decision") in ("NO_DATA", "INSUFFICIENT_DATA"):
            decisions[asset] = {
                "action": "HOLD",
                "position_size": 0,
            }
            continue
        
        llm_decision = get_llm_decision(algo_result)
        position_size = 100 if llm_decision == "BUY" else 0  # Example logic
        
        decisions[asset] = {
            "action": llm_decision,
            "position_size": position_size,
            "macd": algo_result["macd"],
            "signal": algo_result["signal"],
            "price": algo_result["latest_price"]
        }
    
    return {
        "decisions": decisions,
        "timestamp": int(time.time())
    }

def macd_decision_loop(interval=600):
    while True:
        print("\n--- MACD Decision Loop Cycle ---")
        decision_data = fetch_and_analyze()
        print(json.dumps(decision_data, indent=2))
        
        print(f"Waiting {interval} seconds before next cycle...\n")
        time.sleep(interval)

if __name__ == "__main__":
    macd_decision_loop(interval=600)
