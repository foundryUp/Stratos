import time
import requests
import json
import os
from groq import Groq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
POOL_CONFIG = {
    "WETH": {
        "pool_id": "0xc31e54c7a869b9fcbecc14363cf510d1c41fa443",
        "token_symbol": "WETH",
        "rsi_period": 5,
        "overbought": 70,
        "oversold": 30
    },
    "WBTC": {
        "pool_id": "0x0e4831319a50228b9e450861297ab92dee15b44f",
        "token_symbol": "WBTC",
        "rsi_period": 5,
        "overbought": 75,
        "oversold": 25
    },
    "DAI": {
        "pool_id": "0xf0428617433652c9dc6d1093a42adfbf30d29f74",
        "token_symbol": "DAI",
        "rsi_period": 7,
        "overbought": 65,
        "oversold": 35
    }
}

GROQ_MODEL = "llama3-70b-8192"
SUBGRAPH_ENDPOINT = "https://gateway.thegraph.com/api/subgraphs/id/FQ6JYszEKApsBpAmiHesRsd9Ygc6mzmpNRANeVQFYoVX"
HEADERS = {"Authorization": f"Bearer {os.getenv('GRAPH_API_KEY')}"}

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def fetch_pool_data(pool_id):
    """Generic pool data fetcher with retry logic"""
    query = f"""
    {{
      swaps(
        orderBy: timestamp
        orderDirection: desc
        where: {{pool: "{pool_id}"}}
        first: 10
      ) {{
        pool {{
          activeLiquidity
          inputTokenBalances
          inputTokenBalancesUSD
        }}
        tokenIn {{
          lastPriceUSD
          symbol
        }}
        tokenOut {{
          lastPriceUSD
          symbol
        }}
      }}
    }}
    """
    for _ in range(3):
        try:
            response = requests.post(
                SUBGRAPH_ENDPOINT,
                json={"query": query},
                headers=HEADERS,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Retrying {pool_id}... Error: {str(e)}")
            time.sleep(2)
    return None

def extract_token_prices(data, token_symbol):
    """Robust price extraction with data validation"""
    prices = []
    for swap in reversed(data.get("data", {}).get("swaps", [])):
        try:
            in_token = swap.get("tokenIn", {})
            out_token = swap.get("tokenOut", {})
            
            if in_token.get("symbol") == token_symbol:
                price = float(in_token.get("lastPriceUSD", 0))
            elif out_token.get("symbol") == token_symbol:
                price = float(out_token.get("lastPriceUSD", 0))
            else:
                continue
                
            if price > 0:
                prices.append(price)
        except (ValueError, TypeError):
            continue
    return prices

def compute_rsi(prices, period=14):
    """Professional-grade RSI calculation"""
    if len(prices) < period + 1:
        return None

    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def ai_safety_check(asset_data):
    """AI-powered decision validation"""
    system_prompt = f"""Analyze {asset_data['symbol']} trading opportunity:
- Current RSI: {asset_data['rsi']}
- Price: ${asset_data['price']}
- Recent volatility: {asset_data['volatility']}
- Market conditions: {asset_data['market_condition']}

Recommend BUY/SELL/HOLD with 1-word response."""
    
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Make low-risk trading decision"}
            ],
            model=GROQ_MODEL,
            temperature=0.2,
            max_tokens=1
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"AI Safety Check Failed: {str(e)}")
        return "HOLD"

def calculate_position(rsi, decision, base_size=10):
    """Dynamic position sizing algorithm"""
    if decision == "BUY":
        return base_size * max(0, (30 - rsi) / 30)
    elif decision == "SELL":
        return base_size * min(2, (rsi - 70) / 30)
    return 0

def analyze_market_conditions(prices):
    """Market condition classifier"""
    if len(prices) < 3:
        return "neutral"
    
    short_term = sum(prices[-3:])/3
    mid_term = sum(prices[-10:])/10 if len(prices) >=10 else short_term
    return "bullish" if short_term > mid_term else "bearish"

def trading_engine():
    """Main trading decision engine"""
    decisions = {}
    
    for asset, config in POOL_CONFIG.items():
        asset_data = {"symbol": config["token_symbol"]}
        
        # Fetch and process data
        raw_data = fetch_pool_data(config["pool_id"])
        if not raw_data:
            decisions[asset] = {"action": "HOLD", "reason": "data_failure"}
            continue
            
        prices = extract_token_prices(raw_data, config["token_symbol"])
        if len(prices) < config["rsi_period"] + 1:
            decisions[asset] = {"action": "HOLD", "reason": "insufficient_data"}
            continue
            
        # Calculate metrics
        rsi = compute_rsi(prices[-20:], config["rsi_period"])  # Use last 20 prices
        asset_data.update({
            "rsi": rsi,
            "price": prices[-1],
            "volatility": (max(prices[-10:]) - min(prices[-10:])) / min(prices[-10:]),
            "market_condition": analyze_market_conditions(prices)
        })
        
        # Generate initial decision
        if rsi > config["overbought"]:
            decision = "SELL"
        elif rsi < config["oversold"]:
            decision = "BUY"
        else:
            decision = "HOLD"
            
        # AI validation
        final_decision = ai_safety_check(asset_data)
        position_size = calculate_position(rsi, final_decision)
        
        decisions[asset] = {
            "action": final_decision,
            "size": round(position_size, 2),
            "confidence": min(100, max(0, abs(rsi - 50))),
            "metrics": asset_data
        }
    
    return decisions

def main_loop(interval=300):
    """Core trading loop"""
    while True:
        start_time = time.time()
        print(f"\n=== Trading Cycle {time.ctime()} ===")
        
        decisions = trading_engine()
        
        output = {
            "timestamp": int(start_time),
            "decisions": decisions,
            "performance": {
                "processing_time": round(time.time() - start_time, 2),
                "success_rate": round(
                    sum(1 for d in decisions.values() if d["action"] != "HOLD") 
                    / len(decisions), 
                    2
                )
            }
        }
        
        print(json.dumps(output, indent=2))
        
        if interval > 0:
            time.sleep(interval)

if __name__ == "__main__":
    # Initial test with mock data
    test_data = {
        "data": {
            "swaps": [
                {
                    "tokenIn": {"symbol": "WETH", "lastPriceUSD": "1800"},
                    "tokenOut": {"symbol": "USDC", "lastPriceUSD": "1.0"}
                },
                {
                    "tokenIn": {"symbol": "USDC", "lastPriceUSD": "1.0"},
                    "tokenOut": {"symbol": "WETH", "lastPriceUSD": "1850"}
                }
            ]
        }
    }
    print("RSI Test:", compute_rsi([1800, 1850, 1820, 1780, 1900]))
    
    # Start main loop
    main_loop(interval=300)
