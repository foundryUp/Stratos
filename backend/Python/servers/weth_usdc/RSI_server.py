from flask import Flask, jsonify
from flask_cors import CORS
from .RSI_dis import rsi_decision_loop
from .MACD_dis import fetch_and_analyze
from .DCA_dis import dca_decision_loop
from .MA_dis import ma_decision_loop
app = Flask(__name__)
CORS(app)  # Enable CORS for all origins

@app.route("/decisions/high/short", methods=["GET"])
def rsi_decision():
    """
    API endpoint to return RSI-based trading decisions.
    """
    output_json = rsi_decision_loop()  # Execute once and return response
    return jsonify(output_json)

@app.route("/decisions/high/long", methods=["GET"])
def macd_decision():
    """
    API endpoint to return RSI-based trading decisions.
    """
    output_json = fetch_and_analyze()  # Execute once and return response
    return jsonify(output_json)

@app.route("/decisions/low/short", methods=["GET"])
def ma_decision():
    """
    API endpoint to return RSI-based trading decisions.
    """
    output_json = ma_decision_loop()  # Execute once and return response
    return output_json

@app.route("/decisions/low/long", methods=["GET"])
def dca_decision():
    """
    API endpoint to return RSI-based trading decisions.
    """
    output_json = dca_decision_loop()  # Execute once and return response
    return output_json

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050, debug=True)
