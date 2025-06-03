from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os

# Add the parent directories to the path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.append(parent_dir)

# Import the updated SubGraph and algorithms
from SubGraph.wbtc_usdc import get_swaps, get_pool_data
from Algorithms.RSI import calculate_rsi_with_signals
from Algorithms.MACD import calculate_macd_with_signals
from Algorithms.MA import calculate_ma_with_signals
from Algorithms.DCA import calculate_dca_with_signals

app = Flask(__name__)
CORS(app)

# Algorithm mapping based on risk/term combinations
ALGORITHM_MAP = {
    "short_high": "RSI",     # SHORT TERM HIGH RISK
    "long_high": "MACD",     # LONG TERM HIGH RISK
    "short_low": "MA",       # SHORT TERM LOW RISK
    "long_low": "DCA"        # LONG TERM LOW RISK
}

ALGORITHM_FUNCTIONS = {
    "RSI": calculate_rsi_with_signals,
    "MACD": calculate_macd_with_signals,
    "MA": calculate_ma_with_signals,
    "DCA": calculate_dca_with_signals
}

def extract_prices_from_swaps(swaps_data, pool_data):
    """
    Extract prices from swap data for algorithm calculations.
    For WBTC/USDC, we want WBTC price in USD.
    """
    prices = []
    
    if not swaps_data or not pool_data:
        return []
    
    # Get token order from pool data
    token0_symbol = pool_data.get('token0', {}).get('symbol', '')
    token1_symbol = pool_data.get('token1', {}).get('symbol', '')
    
    print(f"Pool tokens: {token0_symbol}/{token1_symbol}")
    
    for swap in reversed(swaps_data):  # Reverse to get chronological order
        try:
            # Extract actual swap price based on amounts
            amount_usd = float(swap.get('amountUSD', 0))
            amount0 = float(swap.get('amount0', 0))
            amount1 = float(swap.get('amount1', 0))
            
            price = None
            
            # For WBTC/USDC pool, calculate WBTC price from swap amounts
            if token0_symbol == 'USDC' and token1_symbol == 'WBTC':
                # USDC is token0, WBTC is token1
                if amount1 != 0:
                    # Price = USD amount / WBTC amount
                    price = amount_usd / abs(amount1)
            elif token0_symbol == 'WBTC' and token1_symbol == 'USDC':
                # WBTC is token0, USDC is token1
                if amount0 != 0:
                    # Price = USD amount / WBTC amount  
                    price = amount_usd / abs(amount0)
            
            # Fallback: try to calculate from amounts ratio
            if price is None or price <= 0:
                if token0_symbol == 'USDC' and token1_symbol == 'WBTC' and amount0 != 0 and amount1 != 0:
                    # USDC amount / WBTC amount = WBTC price in USDC
                    price = abs(amount0) / abs(amount1)
                elif token0_symbol == 'WBTC' and token1_symbol == 'USDC' and amount0 != 0 and amount1 != 0:
                    # USDC amount / WBTC amount = WBTC price in USDC
                    price = abs(amount1) / abs(amount0)
            
            if price and price > 0 and price < 1000000:  # Sanity check for reasonable WBTC price
                prices.append(price)
                print(f"Extracted price: ${price:.2f}")
                
        except (ValueError, KeyError, ZeroDivisionError) as e:
            print(f"Error extracting price from swap: {e}")
            continue
    
    return prices

def get_formatted_data():
    """
    Fetch and format data for WBTC/USDC pair
    """
    try:
        # Get swap data from the SubGraph
        swaps_data = get_swaps()
        pool_data = get_pool_data()
        
        if not swaps_data or not pool_data:
            return {"error": "Failed to fetch data from SubGraph"}
        
        print(f"Fetched {len(swaps_data)} swaps and pool data")
        
        # Extract prices from swaps
        prices = extract_prices_from_swaps(swaps_data, pool_data)
        
        if not prices:
            return {"error": "No valid price data extracted"}
        
        return {
            "pair": "WBTC/USDC",
            "pool_address": "0x99ac8ca7087fa4a2a1fb6357269965a2014abc35",
            "prices": prices,
            "swaps_count": len(swaps_data),
            "pool_data": pool_data
        }
        
    except Exception as e:
        print(f"Error in get_formatted_data: {e}")
        return {"error": str(e)}

def determine_confidence(algorithm, result_data):
    """
    Determine confidence level based on algorithm-specific metrics
    """
    if algorithm == "RSI":
        rsi_value = result_data.get("latest_rsi", 50)
        if rsi_value < 30 or rsi_value > 70:
            return "HIGH"
        elif rsi_value < 40 or rsi_value > 60:
            return "MEDIUM"
        else:
            return "LOW"
    elif algorithm == "MACD":
        # For MACD, high confidence when there's a clear crossover
        macd = result_data.get("latest_macd", 0)
        signal = result_data.get("latest_signal", 0)
        diff = abs(macd - signal)
        if diff > 0.1:
            return "HIGH"
        elif diff > 0.05:
            return "MEDIUM"
        else:
            return "LOW"
    elif algorithm == "MA":
        # For MA, confidence based on the spread between averages
        short_ma = result_data.get("latest_short_ma", 0)
        long_ma = result_data.get("latest_long_ma", 0)
        if long_ma > 0:
            diff = abs(short_ma - long_ma) / long_ma
            if diff > 0.01:
                return "HIGH"
            elif diff > 0.005:
                return "MEDIUM"
        return "LOW"
    elif algorithm == "DCA":
        # DCA always has medium confidence as it's a consistent strategy
        return "MEDIUM"
    
    return "LOW"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "pair": "WBTC/USDC"})

@app.route('/pool/info', methods=['GET'])
def pool_info():
    """Get pool information"""
    pool_data = get_pool_data()
    if pool_data:
        return jsonify(pool_data)
    else:
        return jsonify({"error": "Failed to fetch pool data"}), 500

@app.route('/swaps/recent', methods=['GET'])
def recent_swaps():
    """Get recent swaps data"""
    swaps_data = get_swaps()
    if swaps_data:
        return jsonify({"swaps": swaps_data})
    else:
        return jsonify({"error": "Failed to fetch swaps data"}), 500

@app.route('/decisions/<term>/<risk>', methods=['GET'])
def get_algorithmic_decision(term, risk):
    """
    Main endpoint for algorithmic decisions based on term and risk combinations
    
    Parameters:
      term: 'short' or 'long'
      risk: 'high' or 'low'
    
    Algorithm mapping:
      short + high = RSI
      long + high = MACD
      short + low = MA
      long + low = DCA
    """
    try:
        # Validate parameters
        if term not in ['short', 'long']:
            return jsonify({"error": "Term must be 'short' or 'long'"}), 400
        if risk not in ['high', 'low']:
            return jsonify({"error": "Risk must be 'high' or 'low'"}), 400
        
        # Get algorithm for this combination
        combo_key = f"{term}_{risk}"
        algorithm = ALGORITHM_MAP.get(combo_key)
        
        if not algorithm:
            return jsonify({"error": f"No algorithm found for {term} term {risk} risk"}), 400
        
        # Get formatted swap data
        data = get_formatted_data()
        
        if "error" in data:
            return jsonify(data), 500
        
        prices = data["prices"]
        
        if len(prices) < 14:  # Most algorithms need at least 14 data points
            return jsonify({"error": f"Insufficient data for {algorithm} calculation. Got {len(prices)} prices, need at least 14"}), 400
        
        # Calculate using the appropriate algorithm
        algo_function = ALGORITHM_FUNCTIONS[algorithm]
        algo_data = algo_function(prices)
        
        if "error" in algo_data:
            return jsonify({"error": algo_data["error"]}), 500
        
        # Get the latest signal - prioritize latest_trading_signal
        latest_signal = algo_data.get("latest_trading_signal") or algo_data.get("latest_signal", "HOLD")
        
        # Determine confidence level
        confidence = determine_confidence(algorithm, algo_data)
        
        response = {
            "pair": "WBTC/USDC",
            "pool_address": data["pool_address"],
            "algorithm": algorithm,
            "term": term.upper(),
            "risk": risk.upper(),
            "decision": {
                "signal": latest_signal,
                "confidence": confidence,
                "timestamp": int(data["pool_data"].get("tick", 0)) if data["pool_data"] else None
            },
            "algorithm_data": algo_data,
            "price_info": {
                "latest_price": prices[-1] if prices else 0,
                "price_count": len(prices),
                "price_range": {
                    "min": min(prices) if prices else 0,
                    "max": max(prices) if prices else 0
                }
            },
            "data_points": len(prices)
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Error in get_algorithmic_decision: {e}")
        return jsonify({"error": str(e)}), 500

# Legacy endpoints for backward compatibility
@app.route('/decisions/high', methods=['GET'])
def get_high_frequency_decision():
    """Legacy endpoint - defaults to short term high risk (RSI)"""
    return get_algorithmic_decision('short', 'high')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5051, debug=True) 