#############################SHORT TERM LOW RISK TRADING STRATEGY#############################
#############################  Moving Average Crossover Decision #############################


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

def calculate_ma_with_signals(prices, short_window=3, long_window=5, threshold=0.005):
    """
    Calculate Moving Average and generate trading signals for a list of prices.
    This function is expected by the unified server.
    
    Parameters:
      prices - List of float prices in chronological order
      short_window - Short moving average window (default: 3)
      long_window - Long moving average window (default: 5)
      threshold - Minimum relative difference to trigger trades (default: 0.005 = 0.5%)
    
    Returns:
      Dictionary with MA values and signals
    """
    if len(prices) < long_window:
        return {
            "short_ma": [],
            "long_ma": [],
            "signals": [],
            "error": "Insufficient data for MA calculation"
        }
    
    short_ma_values = []
    long_ma_values = []
    signals = []
    
    # Calculate moving averages for each valid point
    for i in range(long_window - 1, len(prices)):
        short_ma = compute_moving_average(prices[:i+1], short_window)
        long_ma = compute_moving_average(prices[:i+1], long_window)
        
        short_ma_values.append(short_ma)
        long_ma_values.append(long_ma)
        
        # Generate signal based on crossover
        if short_ma and long_ma:
            relative_difference = (short_ma - long_ma) / long_ma
            
            if relative_difference > threshold:
                signals.append("BUY")
            elif relative_difference < -threshold:
                signals.append("SELL") 
            else:
                signals.append("HOLD")
        else:
            signals.append("HOLD")
    
    return {
        "short_ma": short_ma_values,
        "long_ma": long_ma_values,  
        "signals": signals,
        "latest_short_ma": short_ma_values[-1] if short_ma_values else 0,
        "latest_long_ma": long_ma_values[-1] if long_ma_values else 0,
        "latest_signal": signals[-1] if signals else "HOLD"
    }

def compute_moving_average(prices, window):
    """
    Compute the simple moving average (SMA) for the last 'window' prices.
    
    Parameters:
      prices - List of float prices in chronological order.
      window - Number of periods over which to compute the average.
    
    Returns:
      The computed moving average as a float, or None if insufficient data.
    """
    if len(prices) < window:
        return None
    return sum(prices[-window:]) / window

def moving_average_crossover_decision(graph_data, short_window=3, long_window=5, threshold=0.005):
    """
    Implements a moving average crossover strategy designed for short-term, low-risk trading.
    
    Process:
      1. Extract a price series for WETH from the subgraph data.
      2. Compute the short-term moving average (SMA) using 'short_window' periods.
      3. Compute the long-term moving average (SMA) using 'long_window' periods.
      4. Calculate the relative difference between the short-term and long-term averages.
      5. Generate a trading signal based on conservative thresholds:
           - If the short-term SMA exceeds the long-term SMA by more than the 'threshold' percentage, signal BUY.
           - If the short-term SMA falls below the long-term SMA by more than the 'threshold' percentage, signal SELL.
           - Otherwise, signal HOLD.
    
    Parameters:
      graph_data - JSON response from the subgraph.
      short_window - Number of periods for the short-term moving average.
      long_window - Number of periods for the long-term moving average.
      threshold - Minimum relative percentage difference required to trigger a trade.
                  For example, 0.005 corresponds to 0.5%.
    
    Returns:
      A dictionary with:
        - 'decision': Trading decision ("BUY", "SELL", or "HOLD").
        - 'short_ma': The short-term moving average.
        - 'long_ma': The long-term moving average.
        - 'latest_price': The most recent WETH price.
        - 'price_series': The extracted price series.
        - 'relative_difference': The percentage difference between the averages.
    """
    prices = extract_weth_prices(graph_data)
    if not prices:
        return {"decision": "NO_DATA", "reason": "No valid price data found."}
    
    # Ensure sufficient data points for the long-term average.
    if len(prices) < long_window:
        return {"decision": "INSUFFICIENT_DATA", "reason": "Not enough price data for long-term average."}
    
    short_ma = compute_moving_average(prices, short_window)
    long_ma = compute_moving_average(prices, long_window)
    
    # Calculate relative difference between the moving averages.
    relative_difference = (short_ma - long_ma) / long_ma  # expressed as a fraction
    
    # Determine decision based on conservative thresholds.
    if relative_difference > threshold:
        decision = "BUY"
    elif relative_difference < -threshold:
        decision = "SELL"
    else:
        decision = "HOLD"
    
    return {
        "decision": decision,
        "short_ma": short_ma,
        "long_ma": long_ma,
        "latest_price": prices[-1],
        "price_series": prices,
        "relative_difference": relative_difference
    }

# Example usage:
# Assuming 'graph_json' is the JSON response obtained from your subgraph:
# result = moving_average_crossover_decision(graph_json, short_window=3, long_window=5, threshold=0.005)
# print("Moving Average Crossover Decision:", result)
