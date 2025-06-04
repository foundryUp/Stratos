# Stratos Trading Platform Deployment Guide

## Overview
This guide covers deploying the complete Stratos trading platform with:
- Python trading backend (algorithms + market data) ✅ **Fixed SubGraph imports**
- Node.js API server (AI chat + blockchain integration)
- React frontend (already on Vercel)
- Smart contracts (on Sepolia testnet)

## Prerequisites
- GitHub repository
- Render account
- Vercel account
- Infura account (for Ethereum access)
- MetaMask with Sepolia testnet

## ⚠️ IMPORTANT: Fixed Import Issues
**Issue**: The deployment was failing with `ModuleNotFoundError: No module named 'weth_usdc_subgraph'`

**Solution**: Created properly named SubGraph modules:
- `backend/Python/SubGraph/weth_usdc_subgraph.py` with `fetch_weth_usdc_data()`
- `backend/Python/SubGraph/wbtc_usdc_subgraph.py` with `fetch_wbtc_usdc_data()`
- `backend/Python/SubGraph/dai_usdc_subgraph.py` with `fetch_dai_usdc_data()`

All these files are now included and tested locally ✅

## 1. Python Trading Backend (Render)

### Deploy Steps:
1. **Create Web Service on Render:**
   - Repository: Your GitHub repo
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `cd backend/Python && gunicorn --bind 0.0.0.0:$PORT --workers 4 main:app`

2. **Environment Variables:**
   ```
   PYTHON_VERSION=3.9.18
   PORT=(auto-set by Render)
   ```

3. **Expected URL:** `https://stratos-python-backend.onrender.com`

### Test Endpoints:
- Health: `GET /health`
- Trading Signals: `GET /decisions/weth_usdc/short/high`
- Available Pairs: `GET /pairs`

### ✅ Verification Commands:
```bash
# Test locally before deploying
cd backend/Python && python main.py
curl http://localhost:5049/health
curl "http://localhost:5049/decisions/weth_usdc/short/high"
```

Expected responses:
- Health: `{"status":"healthy","algorithms":{"short_high":"RSI",...}}`
- Signals: `{"algorithm":"RSI","decision":{"signal":"HOLD","confidence":"LOW"},...}`

## 2. Node.js Backend (Render)

### Deploy Steps:
1. **Create Web Service on Render:**
   - Repository: Same GitHub repo
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PYTHON_BACKEND_URL=https://stratos-python-backend.onrender.com
   GROQ_API_KEY=your_groq_api_key_here
   PORT=(auto-set by Render)
   ```

3. **Expected URL:** `https://stratos-node-backend.onrender.com`

### Test Endpoints:
- Chat: `POST /api/chat`
- Trading Chat: `POST /api/tradingchat`
- DeFi Chat: `POST /api/defichat`

## 3. Smart Contract Deployment (Sepolia)

### Setup:
1. **Get Sepolia ETH:**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Add Sepolia to MetaMask: Chain ID 11155111

2. **Deploy TradingEngine Contract:**
   ```bash
   forge create --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY \
   --private-key YOUR_PRIVATE_KEY \
   src/intent-engines/TradingEngine.sol:TradingEngine
   ```

3. **Update Contract Address:**
   - Copy deployed contract address
   - Update `TRADING_ENGINE_ADDRESS` in `frontend/src/utils/web3functions.js`

### Sepolia Token Addresses:
```javascript
// Update these in your frontend for Sepolia testnet
const SEPOLIA_TOKENS = {
  WETH: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
  USDC: "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", // Mock USDC
  // Deploy your own test tokens or use existing ones
};
```

## 4. Frontend Environment Variables (Vercel)

### Vercel Dashboard Settings:
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   ```
   REACT_APP_PYTHON_BACKEND_URL=https://stratos-python-backend.onrender.com
   REACT_APP_NODE_BACKEND_URL=https://stratos-node-backend.onrender.com
   REACT_APP_CHAIN_ID=11155111
   REACT_APP_NETWORK_NAME=sepolia
   ```

### Local Development Override:
Create `frontend/.env.local`:
```env
REACT_APP_PYTHON_BACKEND_URL=http://localhost:5049
REACT_APP_NODE_BACKEND_URL=http://localhost:3001
REACT_APP_CHAIN_ID=31337
REACT_APP_NETWORK_NAME=localhost
```

## 5. Alternative: Anvil on Cloud Server

If you prefer to keep using Anvil, deploy it on a VPS:

### DigitalOcean/AWS Setup:
```bash
# Install Foundry on Ubuntu server
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Run Anvil with public access (DANGEROUS - use with caution)
anvil --host 0.0.0.0 --port 8545

# Better: Use reverse proxy with authentication
nginx + basic auth + SSL certificate
```

### Security Considerations:
- **Never expose Anvil directly to internet**
- Use VPN or IP whitelisting
- Consider using managed blockchain services instead

## 6. Testing Deployment

### Python Backend:
```bash
curl https://stratos-python-backend.onrender.com/health
curl https://stratos-python-backend.onrender.com/decisions/weth_usdc/short/high
```

### Node.js Backend:
```bash
curl -X POST https://stratos-node-backend.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}'
```

### Frontend:
- Visit your Vercel URL
- Connect MetaMask to Sepolia
- Test trading signal generation
- Test trade execution

## 7. Monitoring & Maintenance

### Render Monitoring:
- Check logs in Render dashboard
- Set up health check endpoints
- Monitor response times

### Error Handling:
- Python backend: Check SubGraph connectivity
- Node.js backend: Verify API keys
- Frontend: Check network switching

## 8. Cost Optimization

### Render Free Tier Limits:
- 750 hours/month free
- Goes to sleep after 15 minutes of inactivity
- Consider upgrading for production use

### Alternatives:
- **Railway**: Similar to Render, good pricing
- **Heroku**: More expensive but reliable
- **AWS/GCP**: Most scalable but complex setup

## 9. CI/CD Pipeline (Optional)

### GitHub Actions:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          # Render auto-deploys on git push
          echo "Deployment triggered"
```

## 10. Production Checklist

- [ ] All environment variables set correctly
- [ ] Smart contracts deployed and verified
- [ ] Backend health checks passing
- [ ] Frontend connecting to correct networks
- [ ] Error handling and logging implemented
- [ ] Rate limiting on API endpoints
- [ ] HTTPS everywhere
- [ ] Database backups (if using databases)
- [ ] Monitoring and alerting setup

## Troubleshooting

### Common Issues:

#### 1. **Module Import Errors**
- **Error**: `ModuleNotFoundError: No module named 'weth_usdc_subgraph'`
- **Solution**: Ensure all SubGraph files exist with correct function names:
  ```
  backend/Python/SubGraph/
  ├── weth_usdc_subgraph.py (with fetch_weth_usdc_data)
  ├── wbtc_usdc_subgraph.py (with fetch_wbtc_usdc_data)
  └── dai_usdc_subgraph.py (with fetch_dai_usdc_data)
  ```

#### 2. **Algorithm Import Errors** 
- **Error**: Missing algorithm functions
- **Solution**: Ensure these functions exist in Algorithms/:
  ```
  RSI.py: calculate_rsi_with_signals()
  MACD.py: calculate_macd_with_signals()
  MA.py: calculate_ma_with_signals()
  DCA.py: calculate_dca_with_signals()
  ```

#### 3. **SubGraph API Issues**
- **Error**: Empty swaps data or API timeouts
- **Solution**: Check API key and pool addresses in SubGraph files
- **Pool Addresses**:
  - WETH/USDC: `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`
  - WBTC/USDC: `0x99ac8ca7087fa4a2a1fb6357269965a2014abc35`
  - DAI/USDC: `0x5777d92f208679db4b9778590fa3cab3ac9e2168`

#### 4. **Other Common Issues**
- **CORS errors**: Check backend CORS settings
- **Network errors**: Verify environment variables
- **Contract errors**: Check chain ID and addresses
- **API timeouts**: Render free tier sleeps after inactivity

### Logs Access:
- Render: Dashboard → Service → Logs
- Vercel: Dashboard → Project → Functions → View Details
- Browser: Developer Tools → Console

### Debug Commands:
```bash
# Test Python backend locally
cd backend/Python
python -c "from main import app; print('All imports successful')"
python main.py &
curl http://localhost:5049/health

# Test individual SubGraph modules
python -c "from SubGraph.weth_usdc_subgraph import fetch_weth_usdc_data; print(fetch_weth_usdc_data())"

# Test algorithm modules
python -c "from Algorithms.RSI import calculate_rsi_with_signals; print('RSI import OK')"
```

This deployment strategy gives you a fully functional, cloud-hosted trading platform! 