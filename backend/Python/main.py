import subprocess
import time
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import signal
import os

app = Flask(__name__)
CORS(app)

# Import algorithm functions directly for cloud deployment
sys.path.append(os.path.join(os.path.dirname(__file__), 'Algorithms'))
from RSI import calculate_rsi_with_signals
from MACD import calculate_macd_with_signals  
from MA import calculate_ma_with_signals
from DCA import calculate_dca_with_signals

sys.path.append(os.path.join(os.path.dirname(__file__), 'SubGraph'))
from weth_usdc_subgraph import fetch_weth_usdc_data
from wbtc_usdc_subgraph import fetch_wbtc_usdc_data
from dai_usdc_subgraph import fetch_dai_usdc_data

# Algorithm mapping
ALGORITHM_MAP = {
    "short_high": "RSI",
    "long_high": "MACD", 
    "short_low": "MA",
    "long_low": "DCA"
}

ALGORITHM_FUNCTIONS = {
    "RSI": calculate_rsi_with_signals,
    "MACD": calculate_macd_with_signals,
    "MA": calculate_ma_with_signals,
    "DCA": calculate_dca_with_signals
}

# Data fetching functions
DATA_FETCHERS = {
    "weth_usdc": fetch_weth_usdc_data,
    "wbtc_usdc": fetch_wbtc_usdc_data,
    "dai_usdc": fetch_dai_usdc_data
}

def get_formatted_data(pair):
    """Get formatted price data for a trading pair"""
    try:
        fetcher = DATA_FETCHERS.get(pair)
        if not fetcher:
            return {"error": f"No data fetcher for pair: {pair}"}
            
        data = fetcher()
        if "error" in data:
            return data
            
        # Convert to float and sort by timestamp
        prices = []
        for swap in data.get("swaps", []):
            try:
                if pair == "dai_usdc":
                    # For DAI/USDC, price is amount1 / amount0 (USDC per DAI)
                    price = float(swap["amount1"]) / float(swap["amount0"])
                else:
                    # For other pairs, price is amount0 / amount1 
                    price = float(swap["amount0"]) / abs(float(swap["amount1"]))
                prices.append(price)
            except (ValueError, ZeroDivisionError):
                continue
                
        return {"prices": prices, "total_swaps": len(prices)}
        
    except Exception as e:
        return {"error": f"Failed to fetch data for {pair}: {str(e)}"}

def determine_confidence(algorithm, algo_data):
    """Determine confidence level based on algorithm-specific metrics"""
    try:
        if algorithm == "RSI":
            rsi_value = algo_data.get("latest_rsi", 50)
            if rsi_value <= 20 or rsi_value >= 80:
                return "HIGH"
            elif rsi_value <= 35 or rsi_value >= 65:
                return "MEDIUM"
            else:
                return "LOW"
                
        elif algorithm == "MACD":
            histogram = algo_data.get("latest_histogram", 0)
            if abs(histogram) > 0.1:
                return "HIGH"
            elif abs(histogram) > 0.05:
                return "MEDIUM"
            else:
                return "LOW"
                
        elif algorithm == "MA":
            short_ma = algo_data.get("latest_short_ma", 0)
            long_ma = algo_data.get("latest_long_ma", 0)
            if long_ma != 0:
                diff_pct = abs((short_ma - long_ma) / long_ma)
                if diff_pct > 0.02:
                    return "HIGH"
                elif diff_pct > 0.01:
                    return "MEDIUM"
                else:
                    return "LOW"
            return "LOW"
            
        elif algorithm == "DCA":
            return "MEDIUM"
            
        return "MEDIUM"
        
    except Exception:
        return "MEDIUM"

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "algorithms": ALGORITHM_MAP,
        "supported_pairs": list(DATA_FETCHERS.keys())
    })

@app.route('/pairs', methods=['GET'])
def get_pairs():
    """Get list of available trading pairs"""
    return jsonify({
        "pairs": list(DATA_FETCHERS.keys()),
        "algorithms": ALGORITHM_MAP,
        "endpoints": {
            "format": "/decisions/{pair}/{term}/{risk}"
        }
    })

@app.route('/decisions/<pair>/<term>/<risk>', methods=['GET'])
def get_pair_decision_with_algorithm(pair, term, risk):
    """
    Get algorithmic decision for a specific pair with term and risk parameters
    
    Parameters:
      pair: Token pair (weth_usdc, wbtc_usdc, dai_usdc)
      term: 'short' or 'long'
      risk: 'high' or 'low'
    
    Routes to appropriate algorithm:
      short + high = RSI
      long + high = MACD  
      short + low = MA
      long + low = DCA
    """
    try:
        # Validate parameters
        if pair not in DATA_FETCHERS:
            return jsonify({"error": f"Pair '{pair}' not supported. Available pairs: {list(DATA_FETCHERS.keys())}"}), 400
        
        if term not in ['short', 'long']:
            return jsonify({"error": "Term must be 'short' or 'long'"}), 400
        if risk not in ['high', 'low']:
            return jsonify({"error": "Risk must be 'high' or 'low'"}), 400
        
        # Get algorithm for this combination
        combo_key = f"{term}_{risk}"
        algorithm = ALGORITHM_MAP.get(combo_key)
        
        if not algorithm:
            return jsonify({"error": f"No algorithm found for {term} term {risk} risk"}), 400
        
        # Get formatted data
        data = get_formatted_data(pair)
        
        if "error" in data:
            return jsonify(data), 500
        
        prices = data["prices"]
        
        if len(prices) < 14:
            return jsonify({"error": f"Insufficient data for {algorithm} calculation. Got {len(prices)} prices, need at least 14"}), 400
        
        # Calculate using the appropriate algorithm
        algo_function = ALGORITHM_FUNCTIONS[algorithm]
        algo_data = algo_function(prices)
        
        if "error" in algo_data:
            return jsonify({"error": algo_data["error"]}), 500
        
        # Get the latest signal
        latest_signal = algo_data.get("latest_trading_signal") or algo_data.get("latest_signal", "HOLD")
        
        # Determine confidence level
        confidence = determine_confidence(algorithm, algo_data)
        
        return jsonify({
            "pair": pair,
            "algorithm": algorithm,
            "term": term,
            "risk": risk,
            "decision": {
                "signal": latest_signal,
                "confidence": confidence
            },
            "algorithm_data": algo_data,
            "data_points": len(prices),
            "timestamp": time.time()
        })
        
    except Exception as e:
        return jsonify({"error": f"Calculation failed: {str(e)}"}), 500

# Legacy endpoints for backward compatibility
@app.route('/decisions/<pair>/high', methods=['GET'])
def get_pair_decision_legacy(pair):
    """Legacy endpoint - defaults to short term high risk (RSI)"""
    return get_pair_decision_with_algorithm(pair, 'short', 'high')

@app.route('/decisions/high', methods=['GET'])
def get_high_frequency_decision_legacy():
    """Original legacy endpoint - defaults to WETH/USDC short term high risk (RSI)"""
    return get_pair_decision_with_algorithm('weth_usdc', 'short', 'high')

if __name__ == '__main__':
    # For local development, use port 5049
    # For cloud deployment, use environment PORT variable
    port = int(os.environ.get('PORT', 5049))
        
    print("🎯 Unified trading server starting...")
    print(f"📊 Available pairs: {list(DATA_FETCHERS.keys())}")
    print(f"🧠 Algorithm mapping: {ALGORITHM_MAP}")
    print("🔗 Endpoints:")
    print("   GET /decisions/{pair}/{term}/{risk} - Algorithm-specific decisions")
    print("   GET /health - Server status")
    print("   GET /pairs - Available pairs and algorithms")
        
    app.run(host='0.0.0.0', port=port, debug=False)
