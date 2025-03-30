import time
import openai
from ..graph import fetch_graph_data
from ..Algorithms.DCA import dca_investment, rebalance_portfolio

from dotenv import load_dotenv
import os
load_dotenv()

openai.api_key = os.getenv('OPENAI_API_KEY')

def get_llm_decision(portfolio_before, portfolio_after, rebalance_details):
    """
    Example prompt that sends the before/after portfolio states
    to the LLM, asking for a final confirmation or next steps.
    """
    prompt = f"""
    We executed a DCA investment and possibly rebalanced the portfolio.

    Before:
    {portfolio_before}

    After:
    {portfolio_after}

    Rebalance Details:
    {rebalance_details}

    Should we continue this approach or adjust our strategy?
    Respond with a brief explanation or recommendation.
    """

    # This example uses ChatCompletion; adapt as needed.
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )
    return response.choices[0].message.content.strip()

def dca_decision_loop(interval=3600):
    """
    Periodically executes DCA and optional rebalancing.
    Default interval: 3600 seconds (1 hour).
    """
    # Example portfolio with 1000 USDC, 0 WETH initially
    portfolio = {"USDC": 1000.0, "WETH": 0.0}
    target_allocation = {"WETH": 0.6, "USDC": 0.4}  # 60% WETH, 40% USDC
    invest_amount = 100.0  # invest 100 USDC each cycle
    tolerance = 0.02       # 2% tolerance for rebalancing

    while True:
        print("\n--- DCA Decision Loop Cycle ---")
        portfolio_before = portfolio.copy()

        # 1. Fetch data from subgraph
        graph_data = fetch_graph_data()
        if not graph_data:
            print("No data fetched. Retrying next interval...")
            time.sleep(interval)
            continue

        # 2. Execute DCA investment
        portfolio, dca_details = dca_investment(graph_data, invest_amount, portfolio)
        print(f"DCA executed. Details: {dca_details}")

        # 3. Rebalance portfolio if needed
        portfolio, rebalance_details = rebalance_portfolio(
            portfolio, target_allocation, graph_data, tolerance
        )
        print(f"Rebalance attempt. Details: {rebalance_details}")

        # 4. (Optional) Confirm with LLM or get next step
        llm_response = get_llm_decision(portfolio_before, portfolio, rebalance_details)
        print("LLM says:", llm_response)

        # 5. Wait until the next cycle
        print(f"Waiting {interval} seconds until next DCA cycle...\n")
        time.sleep(interval)

if __name__ == "__main__":
    dca_decision_loop(interval=3600)  # Run once per hour by default
