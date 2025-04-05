import time
import json
from datetime import datetime
from ..SubGraph.weth_usdc import fetch_graph_data_weth_usdc
from ..SubGraph.wbtc_usdc import fetch_graph_data_wbtc_usdc
from ..SubGraph.dai_usdc import fetch_graph_data_dai_usdc
from ..Algorithms.DCA import dca_investment, rebalance_portfolio, extract_latest_price, extract_prices
from dotenv import load_dotenv
import os
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))  # New Groq client

def get_llm_decision(portfolio_before, portfolio_after, dca_details, rebalance_details):
    prompt = f"""
    We executed a DCA investment and possibly rebalanced the portfolio.
    
    Before:
    {portfolio_before}
    
    After:
    {portfolio_after}
    
    DCA Details:
    {dca_details}
    
    Rebalance Details:
    {rebalance_details}
    
    Should we continue this approach or adjust our strategy?
    Respond with a brief explanation or recommendation.
    """
    
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-70b-8192",
        temperature=0.3,
        max_tokens=300
    )
    
    return chat_completion.choices[0].message.content.strip()

def fetch_graph_data():
    pools = {
        "BTC": fetch_graph_data_wbtc_usdc,
        "DAI": fetch_graph_data_dai_usdc,
        "WETH": fetch_graph_data_weth_usdc
    }
    
    data = {}
    for asset, fetch_data in pools.items():
        print(f"Fetching data for {asset}...")
        graph_data = fetch_data()
        
        if not graph_data:
            data[asset] = None
        else:
            data[asset] = graph_data
    return data

def generate_decision_json(dca_details, portfolio):
    """
    Generates a JSON response with decision data for each asset.
    """
    decisions = {}
    timestamp = int(time.time())
    
    for asset in ["BTC", "DAI", "WETH"]:
        if asset not in dca_details:
            decisions[asset] = {
                "action": "HOLD",
                "position_size": portfolio.get(asset, 0),
                "price": None,
                "invested": 0
            }
            continue
            
        asset_details = dca_details.get(asset, {})
        
        decisions[asset] = {
            "action": asset_details.get("action", "HOLD"),
            "position_size": portfolio.get(asset, 0),
            "price": asset_details.get("price"),
            "invested": asset_details.get("invested", 0)
        }
    
    return {
        "decisions": decisions,
        "timestamp": timestamp
    }

def dca_decision_loop():
    portfolio = {"USDC": 1000.0, "WETH": 1000.0, "BTC": 1000.0, "DAI": 1000.0}
    target_allocation = {"WETH": 0.4, "BTC": 0.4, "DAI": 0.2, "USDC": 0.0}  # Example allocation
    invest_amount = 100.0  # invest 100 USDC each cycle
    tolerance = 0.02       # 2% tolerance for rebalancing
    
    while True:
        print("\n--- DCA Decision Loop Cycle ---")
        portfolio_before = portfolio.copy()
        
        # Fetch latest data
        graph_data = fetch_graph_data()
        if not any(graph_data.values()):
            print("No data fetched. Retrying next interval...")
            continue
        
        # Perform DCA for each asset
        dca_details = {}
        for asset in ["WETH", "BTC", "DAI"]:
            if asset in graph_data and graph_data[asset]:
                asset_invest_amount = invest_amount * target_allocation.get(asset, 0)
                if asset_invest_amount > 0:
                    portfolio, asset_details = dca_investment(graph_data, asset_invest_amount, portfolio, asset)
                    dca_details[asset] = asset_details
                    print(f"DCA executed for {asset}. Details: {asset_details}")
        
        # Rebalance portfolio
        portfolio, rebalance_details = rebalance_portfolio(
            portfolio, target_allocation, graph_data, tolerance
        )
        print(f"Rebalance attempt. Details: {rebalance_details}")
        
        # Generate decision JSON
        decision_json = generate_decision_json(dca_details, portfolio)
        print("Decision JSON:")
        print(json.dumps(decision_json, indent=4))
        return decision_json



