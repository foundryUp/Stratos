import requests

# Graph endpoint (no API key shown, adapt to your needs)
ENDPOINT = "https://gateway.thegraph.com/api/subgraphs/id/FQ6JYszEKApsBpAmiHesRsd9Ygc6mzmpNRANeVQFYoVX"

# GraphQL query to fetch swaps data from a Uniswap V3 pool
QUERY = """
{
  swaps(
    orderBy: timestamp
    orderDirection: desc
    where: {pool: "0xc31e54c7a869b9fcbecc14363cf510d1c41fa443"}
    first: 100
  ) {
    pool {
      activeLiquidity
      inputTokenBalances
      totalLiquidity
      inputTokenBalancesUSD
    }
    tokenIn {
      lastPriceUSD
      symbol
      _totalSupply
    }
    tokenOut {
      lastPriceUSD
      symbol
      _totalSupply
    }
  }
}
"""

# Optional: If your endpoint requires an API key, include headers here
HEADERS = {
     "Authorization": "Bearer 1106e759dd7fe48331ba9d0f8a178875"  # Uncomment if needed
}

def fetch_graph_data_weth_usdc():
    """
    Fetch data from The Graph and return the JSON response.
    """
    try:
        response = requests.post(ENDPOINT, json={"query": QUERY}, headers=HEADERS)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print("Error fetching data from The Graph:", e)
        return None

def main():
    data = fetch_graph_data_weth_usdc()
    if data:
        print("Data fetched from subgraph:")
        print(data)
    else:
        print("Failed to fetch data.")

if __name__ == "__main__":
    main()
