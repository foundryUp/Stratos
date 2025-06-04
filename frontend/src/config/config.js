// Configuration for backend URLs with fallbacks
// Note: Vercel uses process.env at build time, so we need to check both runtime and build time

// Debug environment detection
console.log('🔍 Environment Detection:', {
  processExists: typeof process !== 'undefined',
  nodeEnv: typeof process !== 'undefined' ? process.env.NODE_ENV : 'undefined',
  isProduction: typeof process !== 'undefined' ? process.env.NODE_ENV === 'production' : false,
  allEnvVars: typeof process !== 'undefined' ? Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')) : 'process undefined'
});

// Helper function to get environment variable safely
const getEnvVar = (varName, fallback) => {
  if (typeof process === 'undefined') {
    console.warn(`⚠️ process is undefined, using fallback for ${varName}:`, fallback);
    return fallback;
  }
  
  const value = process.env[varName];
  console.log(`🔧 Environment Variable ${varName}:`, value || 'undefined');
  
  return value || fallback;
};

// Check if we're running on Vercel (runtime detection)
const isVercelRuntime = typeof window !== 'undefined' && window.location.href.includes('vercel.app');
const isProductionEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

console.log('🌍 Runtime Environment:', {
  isVercelRuntime,
  isProductionEnv,
  currentURL: typeof window !== 'undefined' ? window.location.href : 'server-side'
});

const config = {
  // Node.js backend URL for AI chat endpoints
  NODE_BACKEND_URL: isVercelRuntime 
    ? 'https://ai-quant-trader-1.onrender.com'
    : getEnvVar('REACT_APP_NODE_BACKEND_URL', 'http://localhost:5001'),
  
  // Python backend URL for trading signals
  PYTHON_BACKEND_URL: isVercelRuntime
    ? 'https://ai-quant-trader.onrender.com'
    : getEnvVar('REACT_APP_PYTHON_BACKEND_URL', 'http://localhost:5049'),
    
  // Ethereum/Anvil RPC URL for blockchain interactions
  ETHEREUM_RPC_URL: isVercelRuntime
    ? getEnvVar('REACT_APP_ETHEREUM_RPC_URL', 'https://your-anvil-node.onrender.com')
    : getEnvVar('REACT_APP_ETHEREUM_RPC_URL', 'http://localhost:8545'),
    
  // Anvil-specific URL (for testing and development)
  ANVIL_URL: isVercelRuntime
    ? getEnvVar('REACT_APP_ANVIL_URL', 'https://your-anvil-node.onrender.com')
    : getEnvVar('REACT_APP_ANVIL_URL', 'http://localhost:8545'),
    
  // Network configuration
  CHAIN_ID: isVercelRuntime
    ? getEnvVar('REACT_APP_CHAIN_ID', '31337')  // Anvil chain ID
    : getEnvVar('REACT_APP_CHAIN_ID', '31337'),
    
  NETWORK_NAME: isVercelRuntime
    ? getEnvVar('REACT_APP_NETWORK_NAME', 'anvil')
    : getEnvVar('REACT_APP_NETWORK_NAME', 'localhost')
};

// Final configuration logging
console.log('🎯 Final Config:', config);

// Additional check for production
if (typeof window !== 'undefined') {
  console.log('🌐 Window environment:', {
    location: window.location.href,
    isVercel: window.location.href.includes('vercel.app'),
    userAgent: navigator.userAgent
  });
}

export default config; 