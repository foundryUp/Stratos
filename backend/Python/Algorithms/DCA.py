#############################  LONG TERM LOW RISK TRADING STRATEGY  #############################
#############################  DOLLAR COST AVERAGING   #############################


def extract_weth_prices(graph_data):
    """
    Extracts a chronological list of WETH prices in USD from the subgraph swap data.
    Assumes that the JSON structure is:
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
    
    Since the query orders swaps by timestamp in descending order, this function reverses the list
    to create a chronological (oldest-first) price series.
    """
    swaps = graph_data.get("data", {}).get("swaps", [])
    prices = []
    # Reverse the list so that the earliest swap is first.
    for swap in reversed(swaps):
        price = None
        token_in = swap.get("tokenOut", {})
        # We assume WETH is the asset of interest.
        try:
            price = float(token_in.get("lastPriceUSD", "0"))
        except ValueError:
            price = 0.0
        if price and price > 0:
            prices.append(price)
    return prices

def calculate_dca_with_signals(prices, investment_interval=7, investment_amount=100):
    """
    Calculate DCA strategy and generate consistent trading signals.
    For DCA (Dollar Cost Averaging), we consistently recommend BUY at regular intervals.
    This function is expected by the unified server.
    
    Parameters:
      prices - List of float prices in chronological order
      investment_interval - How often to invest (default: 7 = weekly)
      investment_amount - Amount to invest each time (default: 100 USDC)
    
    Returns:
      Dictionary with DCA values and signals
    """
    if len(prices) < investment_interval:
        return {
            "prices": [],
            "signals": [],
            "average_price": 0,
            "error": "Insufficient data for DCA calculation"
        }
    
    signals = []
    investment_points = []
    total_invested = 0
    total_tokens = 0
    
    # DCA strategy: invest at regular intervals
    for i in range(investment_interval-1, len(prices), investment_interval):
        price = prices[i]
        signals.append("BUY")  # DCA always buys
        investment_points.append({
            "price": price,
            "amount": investment_amount,
            "tokens_bought": investment_amount / price
        })
        total_invested += investment_amount
        total_tokens += investment_amount / price
    
    # Fill remaining periods with HOLD
    current_signals = []
    signal_index = 0
    for i in range(len(prices)):
        if i % investment_interval == investment_interval - 1 and signal_index < len(signals):
            current_signals.append(signals[signal_index])
            signal_index += 1
        else:
            current_signals.append("HOLD")
    
    average_price = total_invested / total_tokens if total_tokens > 0 else 0
    
    return {
        "prices": prices,
        "signals": current_signals,
        "investment_points": investment_points,
        "average_price": average_price,
        "total_invested": total_invested,
        "total_tokens": total_tokens,
        "latest_signal": current_signals[-1] if current_signals else "BUY"
    }

def extract_latest_price(graph_data, asset_type="WETH"):
    """
    Extracts the most recent price (in USDC) from the subgraph data for the specified asset.
    """
    prices = extract_prices(graph_data, asset_type)
    if not prices:
        return None
    return prices[-1]

def extract_prices(graph_data, asset_type="WETH"):
    """
    Extracts a chronological list of prices in USD from the subgraph swap data for the specified asset.
    """
    swaps = graph_data.get("data", {}).get("swaps", [])
    prices = []
    # Reverse the list so that the earliest swap is first.
    for swap in reversed(swaps):
        price = None
        token_in = swap.get("tokenOut", {})
        try:
            price = float(token_in.get("lastPriceUSD", "0"))
        except ValueError:
            price = 0.0
        if price and price > 0:
            prices.append(price)
    return prices

def compute_portfolio_value(portfolio, price_data):
    """
    Computes the total portfolio value in USDC.
    Each asset is valued at its current price.
    Portfolio is a dictionary with keys representing different assets.
    """
    total_value = 0
    for asset, amount in portfolio.items():
        if asset == "USDC":
            total_value += amount
        elif asset in price_data and price_data[asset] is not None:
            total_value += amount * price_data[asset]
    return total_value

def dca_investment(graph_data, invest_amount, portfolio, asset="WETH"):
    """
    Executes a Dollar-Cost Averaging (DCA) investment.
    
    Parameters:
      - graph_data: The graph data containing price information.
      - invest_amount: The USDC amount allocated for this investment cycle.
      - portfolio: A dictionary representing current holdings.
      - asset: The asset to invest in (default is "WETH").
    
    Returns:
      The updated portfolio and details of the transaction.
    """
    current_price = extract_latest_price(graph_data[asset], asset) if asset in graph_data else None
    if current_price is None:
        return portfolio, {"invested": 0, "bought": 0, "price": None, "asset": asset}
    
    # For DCA, assume that if the portfolio does not have sufficient USDC, 
    # additional funds are injected (or invest_amount is added externally).
    if portfolio.get("USDC", 0) < invest_amount:
        portfolio["USDC"] = portfolio.get("USDC", 0) + invest_amount
    
    assets_bought = invest_amount / current_price
    portfolio["USDC"] -= invest_amount
    portfolio[asset] = portfolio.get(asset, 0) + assets_bought
    
    return portfolio, {
        "action": "BUY",  # For DCA, we always buy at regular intervals
        "position_size": assets_bought,
        "price": current_price,
        "invested": invest_amount,
        "asset": asset
    }

def rebalance_portfolio(portfolio, target_allocation, graph_data, tolerance=0.02):
    """
    Rebalances the portfolio to meet the target allocation using a buy-and-hold approach.
    
    Parameters:
      - portfolio: Dictionary with keys for different assets.
      - target_allocation: Dictionary indicating desired ratios.
      - tolerance: The allowable deviation before triggering a rebalance.
      - graph_data: Latest subgraph data to determine current prices.
    
    Returns:
      The updated portfolio along with trade instructions.
    """
    # Extract current prices for all assets
    price_data = {}
    for asset in portfolio:
        if asset == "USDC":
            price_data[asset] = 1.0
        elif asset in graph_data and graph_data[asset]:
            price_data[asset] = extract_latest_price(graph_data[asset], asset)
    
    total_value = compute_portfolio_value(portfolio, price_data)
    
    # Calculate current allocation for each asset
    current_alloc = {}
    for asset in portfolio:
        if asset == "USDC":
            current_alloc[asset] = portfolio[asset] / total_value if total_value > 0 else 0
        elif asset in price_data and price_data[asset]:
            current_alloc[asset] = (portfolio[asset] * price_data[asset]) / total_value if total_value > 0 else 0
    
    trade_instructions = {"trades": []}
    needs_rebalance = False
    
    # Check deviation for each asset
    for asset in target_allocation:
        if asset not in current_alloc:
            current_alloc[asset] = 0
        
        target = target_allocation.get(asset, 0)
        deviation = current_alloc[asset] - target
        
        if abs(deviation) >= tolerance:
            needs_rebalance = True
            
            if deviation > 0:
                # Overallocated: Sell some asset
                if asset != "USDC":
                    value_to_sell = deviation * total_value
                    units_to_sell = value_to_sell / price_data[asset] if asset in price_data and price_data[asset] else 0
                    portfolio[asset] -= units_to_sell
                    portfolio["USDC"] += value_to_sell
                    trade_instructions["trades"].append({
                        "asset": asset,
                        "action": "SELL",
                        "units": units_to_sell,
                        "value": value_to_sell
                    })
            elif deviation < 0 and asset != "USDC":
                # Underallocated: Buy asset using USDC
                value_to_buy = -deviation * total_value
                
                # Ensure there is enough USDC available
                if portfolio.get("USDC", 0) < value_to_buy:
                    value_to_buy = portfolio.get("USDC", 0)
                
                if value_to_buy > 0 and asset in price_data and price_data[asset]:
                    units_to_buy = value_to_buy / price_data[asset]
                    portfolio["USDC"] -= value_to_buy
                    portfolio[asset] = portfolio.get(asset, 0) + units_to_buy
                    trade_instructions["trades"].append({
                        "asset": asset,
                        "action": "BUY",
                        "units": units_to_buy,
                        "value": value_to_buy
                    })
    
    if not needs_rebalance:
        trade_instructions["message"] = "Portfolio within tolerance. No rebalancing required."
    else:
        trade_instructions["message"] = "Portfolio rebalanced."
    
    return portfolio, trade_instructions