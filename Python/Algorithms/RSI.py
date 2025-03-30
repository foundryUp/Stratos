#############################SHORT TERM HIGH RISK TRADING STRATEGY#############################
#############################  RSI   #############################

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
    # print("swapsL",swaps)
    for swap in reversed(swaps):
        price = None
        token_in = swap.get("tokenOut", {})
        # We assume WETH is the asset of interest.
        # print(token_in)
        try:
            price = float(token_in.get("lastPriceUSD", "0"))
            print(price)
        except ValueError:
            price = 0.0
        if price and price > 0:
            prices.append(price)
    # print(prices)
    return prices

def compute_rsi(prices, period=5):
    """
    Computes the Relative Strength Index (RSI) from a list of prices.
    Uses a simple moving average approach for both gains and losses over the specified period.
    
    Parameters:
      prices - List of float prices in chronological order.
      period - Number of periods to use for the RSI calculation.
    
    Returns:
      RSI value (float) calculated over the price series, or None if insufficient data.
    """
    if len(prices) < period + 1:
        return None  # Not enough data points to compute RSI

    gains = []
    losses = []
    # Calculate price differences (delta)
    for i in range(1, len(prices)):
        delta = prices[i] - prices[i - 1]
        if delta > 0:
            gains.append(delta)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(delta))
    
    # Calculate initial average gain and loss
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    # Use a rolling average for the remainder of the data
    for i in range(period, len(gains)):
        current_gain = gains[i]
        current_loss = losses[i]
        avg_gain = ((avg_gain * (period - 1)) + current_gain) / period
        avg_loss = ((avg_loss * (period - 1)) + current_loss) / period
    
    # Avoid division by zero: if avg_loss is zero, RSI is 100.
    if avg_loss == 0:
        return 100.0
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def rsi_strategy_decision(graph_data, rsi_period=5, overbought_threshold=70, oversold_threshold=30):
    """
    Implements an RSI-based trading decision strategy for short-term, high-risk trading.
    
    Process:
      1. Extract the price series for WETH from the subgraph data.
      2. Compute the RSI over a short period (default is 5 periods).
      3. Generate a trading signal:
           - If RSI is above the overbought threshold, signal SELL.
           - If RSI is below the oversold threshold, signal BUY.
           - Otherwise, signal HOLD.
    
    Parameters:
      graph_data - JSON response from the subgraph.
      rsi_period - The lookback period for the RSI calculation.
      overbought_threshold - RSI value above which the asset is considered overbought (default: 70).
      oversold_threshold - RSI value below which the asset is considered oversold (default: 30).
    
    Returns:
      A dictionary containing:
        - 'decision': Trading decision ("BUY", "SELL", or "HOLD").
        - 'rsi': The computed RSI value.
        - 'latest_price': The most recent WETH price.
        - 'price_series': The full extracted price series.
    """
    print(graph_data)
    prices = extract_weth_prices(graph_data)
    if not prices:
        return {"decision": "NO_DATA", "reason": "No valid price data found."}
    
    rsi = compute_rsi(prices, period=rsi_period)
    if rsi is None:
        return {"decision": "INSUFFICIENT_DATA", "reason": "Not enough data to compute RSI."}
    
    if rsi > overbought_threshold:
        decision = "SELL"
    elif rsi < oversold_threshold:
        decision = "BUY"
    else:
        decision = "HOLD"
    
    return {
        "decision": decision,
        "rsi": rsi,
        "latest_price": prices[-1],
        "price_series": prices
    }

# Example of how to use the above functions:
# Suppose 'graph_json' is the JSON response directly obtained from the subgraph.
# The AI agent would call:
#
# result = rsi_strategy_decision(graph_json, rsi_period=5, overbought_threshold=70, oversold_threshold=30)
# print("RSI Strategy Decision:", result)