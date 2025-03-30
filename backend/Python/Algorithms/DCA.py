#############################  LONG TERM LOW RISK TRADING STRATEGY  #############################
#############################  DOLLAR COST AVERAGING   #############################
def extract_weth_prices(graph_data):
    """
    Extracts a chronological list of WETH prices in USD from the subgraph swap data.
    Expected JSON structure:
    {
      "data": {
        "swaps": [
          {
            "pool": { ... },
            "tokenIn": { "lastPriceUSD": "xxx", "symbol": "..." },
            "tokenOut": { "lastPriceUSD": "xxx", "symbol": "..." }
          },
          ...
        ]
      }
    }
    Since the query orders swaps in descending order by timestamp,
    we reverse the list to produce a chronological (oldest-first) price series.
    """
    swaps = graph_data.get("data", {}).get("swaps", [])
    prices = []
    # Process swaps from oldest to newest.
    for swap in reversed(swaps):
        price = None
        token_in = swap.get("tokenIn", {})
        token_out = swap.get("tokenOut", {})
        # Identify WETH by its symbol.
        if token_in.get("symbol") == "WETH":
            try:
                price = float(token_in.get("lastPriceUSD", "0"))
            except ValueError:
                price = 0.0
        elif token_out.get("symbol") == "WETH":
            try:
                price = float(token_out.get("lastPriceUSD", "0"))
            except ValueError:
                price = 0.0
        if price and price > 0:
            prices.append(price)
    return prices

def extract_latest_weth_price(graph_data):
    """
    Extracts the most recent WETH price (in USDC) from the subgraph data.
    """
    prices = extract_weth_prices(graph_data)
    if not prices:
        return None
    return prices[-1]

def compute_portfolio_value(portfolio, current_price):
    """
    Computes the total portfolio value in USDC.
      - WETH holdings are valued at the current price.
      - USDC holdings remain as is.
    Portfolio is a dictionary with keys: "WETH" and "USDC".
    """
    weth_value = portfolio.get("WETH", 0) * current_price
    usdc_value = portfolio.get("USDC", 0)
    return weth_value + usdc_value

def dca_investment(graph_data, invest_amount, portfolio):
    """
    Executes a Dollar-Cost Averaging (DCA) investment.
    
    Parameters:
      - invest_amount: The USDC amount allocated for this investment cycle.
      - portfolio: A dictionary representing current holdings (e.g., {"WETH": 0.0, "USDC": 1000}).
    
    Process:
      1. Fetch the latest WETH price from the subgraph.
      2. Calculate how many WETH tokens can be purchased with 'invest_amount' (weth_bought = invest_amount / price).
      3. Update the portfolio by deducting the invested USDC and adding the acquired WETH.
    
    Returns:
      The updated portfolio and details of the transaction.
    """
    current_price = extract_latest_weth_price(graph_data)
    if current_price is None:
        return portfolio, "No price data available"
    
    # For DCA, assume that if the portfolio does not have sufficient USDC, 
    # additional funds are injected (or invest_amount is added externally).
    if portfolio.get("USDC", 0) < invest_amount:
        portfolio["USDC"] = portfolio.get("USDC", 0) + invest_amount
    
    weth_bought = invest_amount / current_price
    portfolio["USDC"] -= invest_amount
    portfolio["WETH"] = portfolio.get("WETH", 0) + weth_bought
    
    return portfolio, {"invested": invest_amount, "weth_bought": weth_bought, "price": current_price}

def rebalance_portfolio(portfolio, target_allocation, graph_data, tolerance=0.02):
    """
    Rebalances the portfolio to meet the target allocation using a buy-and-hold approach.
    
    Parameters:
      - portfolio: Dictionary with keys "WETH" and "USDC".
      - target_allocation: Dictionary indicating desired ratios, e.g., {"WETH": 0.6, "USDC": 0.4}.
        The values should sum to 1.
      - tolerance: The allowable deviation (e.g., 0.02 for 2%) before triggering a rebalance.
      - graph_data: Latest subgraph data to determine current WETH price.
    
    Process:
      1. Compute the current total portfolio value (in USDC).
      2. Calculate the current allocation for WETH and USDC.
      3. If the deviation from the target allocation exceeds 'tolerance', determine how much to trade.
         - If overallocated in WETH, sell a portion of WETH to increase USDC.
         - If underallocated in WETH, use USDC to buy additional WETH.
    
    Returns:
      The updated portfolio along with trade instructions.
    """
    current_price = extract_latest_weth_price(graph_data)
    if current_price is None:
        return portfolio, "No price data available"
    
    total_value = compute_portfolio_value(portfolio, current_price)
    current_weth_value = portfolio.get("WETH", 0) * current_price
    current_usdc_value = portfolio.get("USDC", 0)
    
    current_alloc_weth = current_weth_value / total_value if total_value > 0 else 0
    current_alloc_usdc = current_usdc_value / total_value if total_value > 0 else 0
    
    target_weth = target_allocation.get("WETH", 0)
    target_usdc = target_allocation.get("USDC", 0)
    
    trade_instructions = {}
    # Calculate deviation for WETH allocation.
    deviation_weth = current_alloc_weth - target_weth
    if abs(deviation_weth) < tolerance:
        # Allocation is within tolerance; no rebalancing needed.
        return portfolio, {"message": "Portfolio within tolerance. No rebalancing required."}
    
    if deviation_weth > 0:
        # Overallocated in WETH: Sell some WETH to increase USDC holdings.
        value_to_sell = (current_alloc_weth - target_weth) * total_value
        weth_to_sell = value_to_sell / current_price
        portfolio["WETH"] -= weth_to_sell
        portfolio["USDC"] += value_to_sell
        trade_instructions["action"] = "SELL_WETH"
        trade_instructions["weth_to_sell"] = weth_to_sell
        trade_instructions["usdc_received"] = value_to_sell
    elif deviation_weth < 0:
        # Underallocated in WETH: Buy WETH using available USDC.
        value_to_buy = (target_weth - current_alloc_weth) * total_value
        weth_to_buy = value_to_buy / current_price
        # Ensure there is enough USDC available.
        if portfolio.get("USDC", 0) < value_to_buy:
            value_to_buy = portfolio.get("USDC", 0)
            weth_to_buy = value_to_buy / current_price
        portfolio["USDC"] -= value_to_buy
        portfolio["WETH"] += weth_to_buy
        trade_instructions["action"] = "BUY_WETH"
        trade_instructions["weth_to_buy"] = weth_to_buy
        trade_instructions["usdc_spent"] = value_to_buy
    
    return portfolio, trade_instructions

# Example of using the above functions:
if __name__ == "__main__":
    # Simulated subgraph JSON data (in practice, use the live JSON response from your Graph query)
    sample_graph_data = {
        "data": {
            "swaps": [
                {
                    "pool": {
                        "activeLiquidity": "143806042277547279",
                        "inputTokenBalances": ["884103982508430051565", "443229485261"],
                        "inputTokenBalancesUSD": ["1731249.4302765468484810087103", "443229.485261"],
                        "totalLiquidity": "368810659123235493410897053"
                    },
                    "tokenIn": {"_totalSupply": "2140436484428", "lastPriceUSD": "1", "symbol": "USDC"},
                    "tokenOut": {"_totalSupply": "54616712146342958192185", "lastPriceUSD": "1958.50689", "symbol": "WETH"}
                },
                # ... add more swap entries as needed for simulation
            ]
        }
    }
    
    # Initial portfolio: starting with some USDC and no WETH.
    portfolio = {"USDC": 1000, "WETH": 0.0}
    
    # Example 1: Execute a DCA investment of 200 USDC.
    portfolio, dca_details = dca_investment(sample_graph_data, invest_amount=200, portfolio=portfolio)
    print("After DCA Investment:")
    print("Portfolio:", portfolio)
    print("DCA Details:", dca_details)
    
    # Example 2: Rebalance portfolio to target allocation: 60% WETH and 40% USDC.
    target_allocation = {"WETH": 0.6, "USDC": 0.4}
    portfolio, rebalance_details = rebalance_portfolio(portfolio, target_allocation, sample_graph_data, tolerance=0.02)
    print("\nAfter Rebalancing:")
    print("Portfolio:", portfolio)
    print("Rebalance Details:", rebalance_details)
