import time
import openai
from ..graph import fetch_graph_data
from ..Algorithms.RSI import rsi_strategy_decision

from dotenv import load_dotenv
import os
load_dotenv()

openai.api_key = os.getenv('OPENAI_API_KEY')

def get_llm_decision(algo_result):
    """
    The algo_result might look like:
      {
        "decision": "BUY"/"SELL"/"HOLD",
        "rsi": ...,
        "latest_price": ...,
        "price_series": [...]
      }
    """
    prompt = f"""
    The RSI-based strategy suggests: {algo_result['decision']}.
    RSI Value: {algo_result['rsi']}
    Latest Price: {algo_result['latest_price']}

    Should we BUY, SELL, or HOLD for a short-term, high-risk approach?
    Respond with only one word: BUY, SELL, or HOLD.
    """
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return response.choices[0].message.content.strip()

def rsi_decision_loop(interval=300):
    """
    Periodically applies an RSI-based strategy for short-term, high-risk trading.
    Default interval: 300 seconds (5 minutes).
    """
    while True:
        print("\n--- RSI Decision Loop Cycle ---")
        graph_data = fetch_graph_data()
        if not graph_data:
            print("No data available. Retrying...")
            time.sleep(interval)
            continue
        
        algo_result = rsi_strategy_decision(
            graph_data,
            rsi_period=5,
            overbought_threshold=70,
            oversold_threshold=30
        )
        print("RSI Algorithm Output:", algo_result)

        if algo_result.get("decision") in ("NO_DATA", "INSUFFICIENT_DATA"):
            print("Not enough data to compute RSI. Skipping...")
            time.sleep(interval)
            continue
        
        # LLM final step
        llm_decision = get_llm_decision(algo_result)
        print("LLM Decision:", llm_decision)

        # Pseudo-trade execution
        if llm_decision == "BUY":
            print(">>> Executing BUY trade <<<")
        elif llm_decision == "SELL":
            print(">>> Executing SELL trade <<<")
        else:
            print(">>> HOLD - No trade executed <<<")
        
        print(f"Waiting {interval} seconds until next cycle...\n")
        time.sleep(interval)

if __name__ == "__main__":
    rsi_decision_loop(interval=300)
