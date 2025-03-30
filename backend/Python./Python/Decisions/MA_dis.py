import time
import json
from datetime import datetime
from ..SubGraph.weth_usdc import fetch_graph_data_weth_usdc
from ..SubGraph.wbtc_usdc import fetch_graph_data_wbtc_usdc
from ..SubGraph.dai_usdc import fetch_graph_data_dai_usdc
from ..Algorithms.MA import moving_average_crossover_decision
from dotenv import load_dotenv
import os

from groq import Groq
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))  # New Groq client



def get_llm_decision(algo_result):
    prompt = f"""
    The Moving Average Crossover algorithm suggests: {algo_result['decision']}.
    Short-term MA: {algo_result['short_ma']}
    Long-term MA: {algo_result['long_ma']}
    Latest Price: {algo_result['latest_price']}
    Relative Diff: {algo_result.get('relative_difference')}

    Please confirm the final decision: BUY, SELL, or HOLD. 
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

        algo_result = moving_average_crossover_decision(graph_data, short_window=3, long_window=5, threshold=0.005)
        print(f"MA Algorithm Output for {asset}:", algo_result)
        
        if algo_result.get("decision") == "NO_DATA":
            decisions[asset] = {
                "action": "HOLD",
                "position_size": 0,
                "reason": "Insufficient data"
            }
            continue
        
        llm_decision = get_llm_decision(algo_result)
        position_size = 100 if llm_decision == "BUY" else 0  # Example logic
        
        decisions[asset] = {
            "action": llm_decision,
            "position_size": position_size,
            "short_ma": algo_result["short_ma"],
            "long_ma": algo_result["long_ma"],
            "price": algo_result["latest_price"],
            "relative_difference": algo_result.get("relative_difference")
        }
    
    return {
        "decisions": decisions,
        "timestamp": int(time.time())
    }

def ma_decision_loop():
    print("\n--- MA Decision Loop Cycle ---")
    decision_data = fetch_and_analyze()
    return decision_data  # Ensure function returns JSON string

