#############################LONG TERM HIGH RISK TRADING STRATEGY#############################
#############################MOVING AVERAGE CONVERGENCE DIVERGENCE#############################


def extract_weth_prices(graph_data):
    """
    Extract a chronological list of WETH prices in USD from subgraph swap data.
    Assumes the JSON structure:
      {
        "data": {
          "swaps": [
            {
              "pool": {...},
              "tokenIn": {"lastPriceUSD": "xxx", "symbol": "..."},
              "tokenOut": {"lastPriceUSD": "xxx", "symbol": "..."}
            },
            ...
          ]
        }
      }
    Since the query returns swaps in descending order by timestamp,
    this function reverses the list so that prices are in chronological order.
    """
    swaps = graph_data.get("data", {}).get("swaps", [])
    prices = []
    # Process swaps in reverse (oldest first)
    for swap in reversed(swaps):
        price = None
        token_in = swap.get("tokenIn", {})
        token_out = swap.get("tokenOut", {})
        # Identify WETH by symbol.
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

def compute_ema(prices, period):
    """
    Compute the Exponential Moving Average (EMA) for a given list of prices and period.
    
    Parameters:
      prices - List of float prices (assumed in chronological order).
      period - Number of periods for EMA calculation.
    
    Returns:
      List of EMA values where the first EMA is the simple average of the first 'period' prices.
      Subsequent values use the standard EMA formula.
    """
    if len(prices) < period:
        return []
    ema_values = []
    # Start with a simple average for the first EMA value.
    initial_ema = sum(prices[:period]) / period
    ema_values.append(initial_ema)
    multiplier = 2 / (period + 1)
    # Compute EMA for each subsequent price.
    for price in prices[period:]:
        prev_ema = ema_values[-1]
        ema = (price - prev_ema) * multiplier + prev_ema
        ema_values.append(ema)
    # Prepend the initial period with None to align the indices if needed.
    return [None]*(period-1) + ema_values

def compute_macd(prices, short_period=12, long_period=26, signal_period=9):
    """
    Compute the MACD line and Signal line from the price series.
    
    MACD is defined as the difference between the short-term EMA and the long-term EMA.
    The Signal line is the EMA of the MACD line.
    
    Parameters:
      prices        - List of float prices in chronological order.
      short_period  - Period for the short-term EMA (default: 12).
      long_period   - Period for the long-term EMA (default: 26).
      signal_period - Period for the Signal line EMA (default: 9).
      
    Returns:
      A tuple (macd_line, signal_line), each being a list aligned with the price series.
      Note: Leading None values may appear where data is insufficient.
    """
    if len(prices) < long_period:
        return [], []  # Insufficient data
    
    # Compute short-term and long-term EMAs.
    short_ema = compute_ema(prices, short_period)
    long_ema = compute_ema(prices, long_period)
    
    # MACD line: difference between short-term EMA and long-term EMA.
    macd_line = []
    # We align the MACD line to the longer EMA since data before that is None.
    for s, l in zip(short_ema, long_ema):
        if s is None or l is None:
            macd_line.append(None)
        else:
            macd_line.append(s - l)
    
    # Filter out None values for computing the Signal line.
    valid_macd = [m for m in macd_line if m is not None]
    if len(valid_macd) < signal_period:
        # Not enough MACD values to compute the signal line.
        signal_line = [None] * len(macd_line)
    else:
        # Compute EMA on the MACD line for the signal line.
        signal_values = compute_ema(valid_macd, signal_period)
        # Reconstruct the signal_line to align with the full macd_line.
        signal_line = [None]*(len(macd_line) - len(signal_values)) + signal_values
    return macd_line, signal_line

def macd_strategy_decision(graph_data, short_period=12, long_period=26, signal_period=9):
    """
    Implements a MACD-based trading strategy for a long-term, high-risk scenario.
    
    Process:
      1. Extract the WETH price series from the subgraph data.
      2. Compute the MACD line and its Signal line.
      3. Generate a trading signal:
           - If the latest MACD value is above its Signal line (and a bullish crossover is detected),
             signal BUY.
           - If the latest MACD value is below its Signal line (and a bearish crossover is detected),
             signal SELL.
           - Otherwise, signal HOLD.
    
    Parameters:
      graph_data    - JSON response from the subgraph.
      short_period  - Short-term EMA period for MACD calculation.
      long_period   - Long-term EMA period for MACD calculation.
      signal_period - EMA period for computing the Signal line.
    
    Returns:
      A dictionary containing:
        - 'decision': "BUY", "SELL", or "HOLD".
        - 'macd': Latest MACD value.
        - 'signal': Latest Signal line value.
        - 'latest_price': Most recent WETH price.
        - 'price_series': The extracted WETH price series.
        - 'macd_line': The complete MACD line.
        - 'signal_line': The complete Signal line.
    """
    prices = extract_weth_prices(graph_data)
    if not prices:
        return {"decision": "NO_DATA", "reason": "No valid price data found."}
    
    macd_line, signal_line = compute_macd(prices, short_period, long_period, signal_period)
    # Ensure we have computed valid MACD and Signal values.
    if not macd_line or macd_line[-1] is None or signal_line[-1] is None:
        return {"decision": "INSUFFICIENT_DATA", "reason": "Not enough data to compute MACD."}
    
    latest_macd = macd_line[-1]
    latest_signal = signal_line[-1]
    
    # A simple decision rule based on the latest MACD crossover:
    if latest_macd > latest_signal:
        decision = "BUY"
    elif latest_macd < latest_signal:
        decision = "SELL"
    else:
        decision = "HOLD"
    
    return {
        "decision": decision,
        "macd": latest_macd,
        "signal": latest_signal,
        "latest_price": prices[-1],
        "price_series": prices,
        "macd_line": macd_line,
        "signal_line": signal_line
    }

# Example usage:
# Suppose 'graph_json' is the JSON response directly obtained from the subgraph.
# The AI agent would call:
#
# result = macd_strategy_decision(graph_json, short_period=12, long_period=26, signal_period=9)
# print("MACD Strategy Decision:", result)
