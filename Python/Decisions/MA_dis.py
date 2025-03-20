import time
import openai
from graph import fetch_graph_data
from Algorithms.MA import moving_average_crossover_decision

openai.api_key = "YOUR_OPENAI_API_KEY"

def get_llm_decision(algo_result):
    """
    Ask the LLM to confirm or refine the final action.
    The algo_result might look like:
      {
        "decision": "BUY" or "SELL" or "HOLD",
        "short_ma": ...,
        "long_ma": ...,
        "latest_price": ...,
        "relative_difference": ...
      }
    """
    prompt = f"""
    The Moving Average Crossover algorithm suggests: {algo_result['decision']}.
    Short-term MA: {algo_result['short_ma']}
    Long-term MA: {algo_result['long_ma']}
    Latest Price: {algo_result['latest_price']}
    Relative Diff: {algo_result.get('relative_difference')}

    Please confirm the final decision: BUY, SELL, or HOLD. 
    Respond with only one word: BUY, SELL, or HOLD.
    """
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return response.choices[0].message.content.strip()

def ma_decision_loop(interval=300):
    """
    Periodically fetches market data and applies a short-term, low-risk
    moving average crossover strategy. Default interval: 300 seconds (5 minutes).
    """
    while True:
        print("\n--- MA Decision Loop Cycle ---")
        graph_data = fetch_graph_data()
        if not graph_data:
            print("No data available. Will retry...")
            time.sleep(interval)
            continue
        
        algo_result = moving_average_crossover_decision(
            graph_data,
            short_window=3,
            long_window=5,
            threshold=0.005
        )
        print("Algorithm Output:", algo_result)

        if algo_result.get("decision") in ("NO_DATA", "INSUFFICIENT_DATA"):
            print("Insufficient data to make a decision. Skipping...")
            time.sleep(interval)
            continue
        
        # LLM final confirmation
        llm_decision = get_llm_decision(algo_result)
        print("LLM Decision:", llm_decision)

        # Pseudo-code for trade execution:
        if llm_decision == "BUY":
            print(">>> Executing BUY on-chain <<<")
        elif llm_decision == "SELL":
            print(">>> Executing SELL on-chain <<<")
        else:
            print(">>> HOLD - No trade executed <<<")

        print(f"Waiting {interval} seconds until next cycle...\n")
        time.sleep(interval)

if __name__ == "__main__":
    ma_decision_loop(interval=300)
