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

# Server configurations - updated to use server.py
SERVER_CONFIGS = {
    "weth_usdc": {"port": 5050, "script": "servers/weth_usdc/server.py"},
    "wbtc_usdc": {"port": 5051, "script": "servers/wbtc_usdc/server.py"},
    "dai_usdc": {"port": 5052, "script": "servers/dai_usdc/server.py"}
}

# Store server processes
server_processes = {}

# Algorithm mapping for reference
ALGORITHM_MAP = {
    "short_high": "RSI",     # SHORT TERM HIGH RISK
    "long_high": "MACD",     # LONG TERM HIGH RISK
    "short_low": "MA",       # SHORT TERM LOW RISK
    "long_low": "DCA"        # LONG TERM LOW RISK
}

def start_server(pair_name, config):
    """Start a token pair server"""
    try:
        process = subprocess.Popen([
            sys.executable, config["script"]
        ], cwd=os.getcwd())
        server_processes[pair_name] = process
        time.sleep(2)  # Give server time to start
        print(f"✅ Started {pair_name} server on port {config['port']}")
        return True
    except Exception as e:
        print(f"❌ Failed to start {pair_name} server: {e}")
        return False

def stop_server(pair_name):
    """Stop a token pair server"""
    if pair_name in server_processes:
        try:
            server_processes[pair_name].terminate()
            server_processes[pair_name].wait(timeout=5)
            del server_processes[pair_name]
            print(f"🛑 Stopped {pair_name} server")
            return True
        except Exception as e:
            print(f"❌ Error stopping {pair_name} server: {e}")
            return False
    return False

def check_server_health(pair_name, port):
    """Check if a server is healthy"""
    try:
        response = requests.get(f"http://localhost:{port}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

def start_all_servers():
    """Start all token pair servers"""
    print("🚀 Starting all token pair servers...")
    for pair_name, config in SERVER_CONFIGS.items():
        start_server(pair_name, config)

def stop_all_servers():
    """Stop all token pair servers"""
    print("🛑 Stopping all servers...")
    for pair_name in list(server_processes.keys()):
        stop_server(pair_name)

def signal_handler(sig, frame):
    """Handle shutdown signals"""
    print("\n📴 Shutting down...")
    stop_all_servers()
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check for the routing server"""
    server_statuses = {}
    for pair_name, config in SERVER_CONFIGS.items():
        server_statuses[pair_name] = {
            "healthy": check_server_health(pair_name, config["port"]),
            "port": config["port"]
        }
    
    return jsonify({
        "routing_server": "healthy",
        "servers": server_statuses,
        "algorithms": ALGORITHM_MAP
    })

@app.route('/pairs', methods=['GET'])
def get_pairs():
    """Get list of available trading pairs"""
    return jsonify({
        "pairs": list(SERVER_CONFIGS.keys()),
        "algorithms": ALGORITHM_MAP,
        "endpoints": {
            "new_format": "/decisions/{pair}/{term}/{risk}",
            "legacy_format": "/decisions/{pair}/high"
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
    if pair not in SERVER_CONFIGS:
        return jsonify({"error": f"Pair '{pair}' not supported. Available pairs: {list(SERVER_CONFIGS.keys())}"}), 400
    
    config = SERVER_CONFIGS[pair]
    
    # Check if server is healthy
    if not check_server_health(pair, config["port"]):
        return jsonify({"error": f"Server for {pair} is not available"}), 503
    
    try:
        # Forward request to the specific pair server
        response = requests.get(
            f"http://localhost:{config['port']}/decisions/{term}/{risk}",
            timeout=10
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return jsonify({"error": f"Server returned status {response.status_code}"}), response.status_code
            
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to connect to {pair} server: {str(e)}"}), 503

@app.route('/decisions/<pair>/high', methods=['GET'])
def get_pair_decision_legacy(pair):
    """
    Legacy endpoint - defaults to short term high risk (RSI)
    Maintains backward compatibility
    """
    return get_pair_decision_with_algorithm(pair, 'short', 'high')

# Additional legacy endpoint for the original format
@app.route('/decisions/high', methods=['GET'])
def get_high_frequency_decision_legacy():
    """
    Original legacy endpoint - defaults to WETH/USDC short term high risk (RSI)
    """
    return get_pair_decision_with_algorithm('weth_usdc', 'short', 'high')

@app.route('/servers/start/<pair>', methods=['POST'])
def start_specific_server(pair):
    """Start a specific server"""
    if pair not in SERVER_CONFIGS:
        return jsonify({"error": f"Unknown pair: {pair}"}), 400
    
    if start_server(pair, SERVER_CONFIGS[pair]):
        return jsonify({"message": f"Started {pair} server"})
    else:
        return jsonify({"error": f"Failed to start {pair} server"}), 500

@app.route('/servers/stop/<pair>', methods=['POST'])  
def stop_specific_server(pair):
    """Stop a specific server"""
    if pair not in SERVER_CONFIGS:
        return jsonify({"error": f"Unknown pair: {pair}"}), 400
    
    if stop_server(pair):
        return jsonify({"message": f"Stopped {pair} server"})
    else:
        return jsonify({"error": f"Failed to stop {pair} server"}), 500

@app.route('/servers/restart/<pair>', methods=['POST'])
def restart_specific_server(pair):
    """Restart a specific server"""
    if pair not in SERVER_CONFIGS:
        return jsonify({"error": f"Unknown pair: {pair}"}), 400
    
    stop_server(pair)
    time.sleep(1)
    if start_server(pair, SERVER_CONFIGS[pair]):
        return jsonify({"message": f"Restarted {pair} server"})
    else:
        return jsonify({"error": f"Failed to restart {pair} server"}), 500

if __name__ == '__main__':
    try:
        # Start all servers
        start_all_servers()
        
        print("🎯 Main routing server starting on port 5049...")
        print(f"📊 Available pairs: {list(SERVER_CONFIGS.keys())}")
        print(f"🧠 Algorithm mapping: {ALGORITHM_MAP}")
        print("🔗 New endpoints:")
        print("   GET /decisions/{pair}/{term}/{risk} - Algorithm-specific decisions")
        print("   Examples:")
        print("     /decisions/weth_usdc/short/high  -> RSI")
        print("     /decisions/weth_usdc/long/high   -> MACD")
        print("     /decisions/weth_usdc/short/low   -> MA")
        print("     /decisions/weth_usdc/long/low    -> DCA")
        print("🔗 Legacy endpoints:")
        print("   GET /decisions/{pair}/high - Defaults to RSI")
        print("   GET /decisions/high - Defaults to WETH/USDC RSI")
        print("🔗 Management endpoints:")
        print("   GET /health - Server status")
        print("   GET /pairs - Available pairs and algorithms")
        
        app.run(host='0.0.0.0', port=5049, debug=False)
        
    except KeyboardInterrupt:
        print("\n📴 Shutting down...")
    finally:
        stop_all_servers()
