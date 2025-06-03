import requests
import json
import os

def get_price_range(range_choice, current_price):
    if range_choice == "narrow":
        return current_price * 0.95, current_price * 1.05
    elif range_choice == "medium":
        return current_price * 0.9, current_price * 1.1
    elif range_choice == "wide":
        return current_price * 0.8, current_price * 1.2
    else:
        return current_price * 0.9, current_price * 1.1

def get_swaps():
    # Use the provided API key and endpoint
    api_key = "73419c7a18a27c80dcea6b9416db18bd"
    subgraph_url = f"https://gateway.thegraph.com/api/{api_key}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
    
    # Ethereum mainnet WETH/USDC pool address (0.05% fee tier)
    pool_address = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
    
    query = f"""
    {{
      swaps(
        orderBy: timestamp,
        orderDirection: desc,
        first: 20,
        where: {{
          pool: "{pool_address}"
        }}
      ) {{
        id
        timestamp
        amount0
        amount1
        amountUSD
        tick
        transaction {{
          id
        }}
        pool {{
          id
          token0 {{
            symbol
            decimals
          }}
          token1 {{
            symbol
            decimals
          }}
          token0Price
          token1Price
        }}
      }}
    }}
    """
    
    try:
        response = requests.post(subgraph_url, json={'query': query}, timeout=10)
        
        print(f"SubGraph Response Status: {response.status_code}")
        
        if response.status_code == 200:
            response_json = response.json()
            
            if 'errors' in response_json:
                print(f"SubGraph errors: {response_json['errors']}")
                return []
            
            if 'data' in response_json and 'swaps' in response_json['data']:
                swaps = response_json['data']['swaps']
                print(f"Successfully fetched {len(swaps)} swaps")
                return swaps
            else:
                print("No 'data' or 'swaps' in response")
                return []
        else:
            print(f"Failed to fetch data: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        print(f"Error fetching swaps data: {e}")
        return []

def get_pool_data():
    # Use the provided API key and endpoint
    api_key = "73419c7a18a27c80dcea6b9416db18bd"
    subgraph_url = f"https://gateway.thegraph.com/api/{api_key}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
    
    # Ethereum mainnet WETH/USDC pool address (0.05% fee tier)
    pool_address = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
    
    query = f"""
    {{
      pool(id: "{pool_address}") {{
        id
        liquidity
        totalValueLockedETH
        totalValueLockedToken0
        totalValueLockedToken1
        totalValueLockedUSD
        volumeToken0
        volumeToken1
        volumeUSD
        token0 {{
          symbol
          decimals
          name
        }}
        token1 {{
          symbol
          decimals
          name
        }}
        token0Price
        token1Price
        feeTier
        tick
        sqrtPrice
      }}
    }}
    """
    
    try:
        response = requests.post(subgraph_url, json={'query': query}, timeout=10)
        
        if response.status_code == 200:
            response_json = response.json()
            
            if 'errors' in response_json:
                print(f"SubGraph errors: {response_json['errors']}")
                return None
            
            if 'data' in response_json and 'pool' in response_json['data']:
                pool_data = response_json['data']['pool']
                if pool_data:
                    print("Successfully fetched pool data")
                    return pool_data
                else:
                    print("Pool not found")
                    return None
            else:
                print("No pool data in response")
                return None
        else:
            print(f"Failed to fetch pool data: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"Error fetching pool data: {e}")
        return None

def main():
    print("Testing WETH/USDC SubGraph with provided API key...")
    
    # Test pool data
    pool_data = get_pool_data()
    if pool_data:
        print("Pool Data:")
        print(json.dumps(pool_data, indent=2))
    
    # Test swaps data
    swaps_data = get_swaps()
    if swaps_data:
        print(f"\nSwaps Data (showing first 3):")
        for i, swap in enumerate(swaps_data[:3]):
            print(f"Swap {i+1}: {json.dumps(swap, indent=2)}")
    else:
        print("Failed to fetch swaps data.")

if __name__ == "__main__":
    main()
