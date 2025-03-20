import time
import openai
from graph import fetch_graph_data
from Algorithms.MACD import macd_strategy_decision

openai.api_key = "YOUR_OPENAI_API_KEY"

def get_llm_decision(algo_result):
    """
    The algo_result might look like:
      {
        "decision": "BUY" or "SELL" or "HOLD",
        "macd": ...,
        "signal": ...,
        "latest_price": ...,
        "macd_line": [...],
        "signal_line": [...]
      }
    """
    prompt = f"""
    The MACD-based strategy suggests: {algo_result['decision']}.
    Latest MACD: {algo_result['macd']}
    Latest Signal: {algo_result['signal']}
    Latest Price: {algo_result['latest_price']}

    Do we BUY, SELL, or HOLD? 
    Respond with only one word: BUY, SELL, or HOLD.
    """
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return response.choices[0].message.content.strip()

def macd_decision_loop(interval=600):
    """
    Periodically applies a MACD strategy for long-term, high-risk trades.
    Default interval: 600 seconds (10 minutes).
    """
    while True:
        print("\n--- MACD Decision Loop Cycle ---")
        graph_data = fetch_graph_data()
        if not graph_data:
            print("No data returned. Retrying...")
            time.sleep(interval)
            continue
        
        algo_result = macd_strategy_decision(
            graph_data,
            short_period=12,
            long_period=26,
            signal_period=9
        )
        print("MACD Algorithm Output:", algo_result)

        if algo_result.get("decision") in ("NO_DATA", "INSUFFICIENT_DATA"):
            print("Insufficient data to compute MACD. Skipping...")
            time.sleep(interval)
            continue
        
        # Final decision from LLM
        llm_decision = get_llm_decision(algo_result)
        print("LLM Decision:", llm_decision)

        # Pseudo-code for trade:
        if llm_decision == "BUY":
            print(">>> Executing BUY trade <<<")
        elif llm_decision == "SELL":
            print(">>> Executing SELL trade <<<")
        else:
            print(">>> HOLD - No trade executed <<<")
        
        print(f"Waiting {interval} seconds before next cycle...\n")
        time.sleep(interval)

if __name__ == "__main__":
    macd_decision_loop(interval=600)
