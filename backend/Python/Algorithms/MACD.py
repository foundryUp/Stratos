#############################LONG TERM HIGH RISK TRADING STRATEGY#############################
#############################MOVING AVERAGE CONVERGENCE DIVERGENCE#############################

def extract_USDC_prices(graph_data):
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

def calculate_macd_with_signals(prices, short=12, long=26, signal=9):
    """
    Calculate MACD and generate trading signals for a list of prices.
    This function is expected by the unified server.
    Uses adaptive periods for smaller datasets.
    
    Parameters:
      prices - List of float prices in chronological order
      short - Short EMA period (default: 12)
      long - Long EMA period (default: 26) 
      signal - Signal line EMA period (default: 9)
    
    Returns:
      Dictionary with MACD values and signals
    """
    data_length = len(prices)
    
    # Adaptive periods for smaller datasets
    if data_length < 26:
        if data_length >= 14:
            # Use smaller periods for limited data
            short = min(short, 5)
            long = min(long, 10)
            signal = min(signal, 5)
        else:
            return {
                "macd": [],
                "signal": [],
                "signals": [],
                "error": "Insufficient data for MACD calculation"
            }
    
    if data_length < max(short, long, signal):
        return {
            "macd": [],
            "signal": [],
            "signals": [],
            "error": f"Need at least {max(short, long, signal)} data points for MACD calculation"
        }
    
    macd_line, signal_line = compute_macd(prices, short, long, signal)
    
    # Generate trading signals based on MACD crossovers
    signals = []
    for i in range(1, len(macd_line)):
        if macd_line[i] is None or signal_line[i] is None:
            signals.append("HOLD")
            continue
        if macd_line[i-1] is None or signal_line[i-1] is None:
            signals.append("HOLD")
            continue
            
        # Crossover detection
        if macd_line[i] > signal_line[i] and macd_line[i-1] <= signal_line[i-1]:
            signals.append("BUY")
        elif macd_line[i] < signal_line[i] and macd_line[i-1] >= signal_line[i-1]:
            signals.append("SELL")
        else:
            signals.append("HOLD")
    
    return {
        "macd": [m for m in macd_line if m is not None],
        "signal": [s for s in signal_line if s is not None],
        "signals": signals,
        "latest_macd": macd_line[-1] if macd_line and macd_line[-1] is not None else 0,
        "latest_signal": signal_line[-1] if signal_line and signal_line[-1] is not None else 0,
        "latest_trading_signal": signals[-1] if signals else "HOLD",
        "parameters": {"short": short, "long": long, "signal": signal}
    }

def compute_ema(prices, period):
    """Robust EMA calculation with input validation"""
    if not prices or len(prices) < period:
        return []
    
    ema_values = []
    smoothing = 2 / (period + 1)
    
    # Simple moving average as initial EMA
    try:
        current_ema = sum(prices[:period]) / period
    except ZeroDivisionError:
        return []
    
    ema_values.append(current_ema)
    
    for price in prices[period:]:
        current_ema = (price - current_ema) * smoothing + current_ema
        ema_values.append(current_ema)
    
    # Pad with None for alignment
    return [None]*(period-1) + ema_values

def compute_macd(prices, short=12, long=26, signal=9):
    """MACD calculation with alignment guarantees"""
    if len(prices) < max(short, long):
        return [], []
    
    # Compute EMAs with proper alignment
    short_ema = compute_ema(prices, short)
    long_ema = compute_ema(prices, long)
    
    # Calculate MACD line (ensure equal length)
    min_length = min(len(short_ema), len(long_ema))
    macd_line = [
        (s - l) if s is not None and l is not None else None
        for s, l in zip(short_ema[:min_length], long_ema[:min_length])
    ]
    
    # Calculate signal line using valid MACD values
    valid_macd = [m for m in macd_line if m is not None]
    if len(valid_macd) >= signal:
        signal_ema = compute_ema(valid_macd, signal)
        signal_padding = len(macd_line) - len(signal_ema)
        signal_line = [None]*signal_padding + signal_ema
    else:
        signal_line = [None]*len(macd_line)
    
    return macd_line, signal_line

def macd_strategy_decision(graph_data):
    """Final decision logic with safety checks"""
    prices = extract_USDC_prices(graph_data)
    
    if not prices:
        return {"decision": "NO_DATA", "reason": "Empty price series"}
    
    macd, signal = compute_macd(prices)
    
    # Ensure we have at least 2 valid points for crossover detection
    valid_macd = [m for m in macd[-2:] if m is not None]
    valid_signal = [s for s in signal[-2:] if s is not None]
    
    if len(valid_macd) < 2 or len(valid_signal) < 2:
        return {"decision": "INSUFFICIENT_DATA", "reason": "Need 2+ MACD/Signal points"}
    
    latest_price = prices[-1]
    current_macd = valid_macd[-1]
    current_signal = valid_signal[-1]
    
    # Crossover detection
    prev_macd = valid_macd[-2]
    prev_signal = valid_signal[-2]
    
    decision = "HOLD"
    if current_macd > current_signal and prev_macd <= prev_signal:
        decision = "BUY"
    elif current_macd < current_signal and prev_macd >= prev_signal:
        decision = "SELL"
    
    return {
        "decision": decision,
        "macd": current_macd,
        "signal": current_signal,
        "latest_price": latest_price,
        "price_series": prices,
        "macd_line": macd,
        "signal_line": signal
    }
