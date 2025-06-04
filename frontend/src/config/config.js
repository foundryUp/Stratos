// Configuration for backend URLs with fallbacks
const config = {
  // Node.js backend URL for AI chat endpoints
  NODE_BACKEND_URL: 
    (typeof process !== 'undefined' && process.env?.REACT_APP_NODE_BACKEND_URL) || 
    'http://localhost:5001',
  
  // Python backend URL for trading signals
  PYTHON_BACKEND_URL: 
    (typeof process !== 'undefined' && process.env?.REACT_APP_PYTHON_BACKEND_URL) || 
    'http://localhost:5049',
    
  // Network configuration
  CHAIN_ID: 
    (typeof process !== 'undefined' && process.env?.REACT_APP_CHAIN_ID) || 
    '31337',
    
  NETWORK_NAME: 
    (typeof process !== 'undefined' && process.env?.REACT_APP_NETWORK_NAME) || 
    'localhost'
};

// Debug logging
console.log('🔧 Config loaded:', {
  NODE_BACKEND_URL: config.NODE_BACKEND_URL,
  PYTHON_BACKEND_URL: config.PYTHON_BACKEND_URL,
  CHAIN_ID: config.CHAIN_ID,
  NETWORK_NAME: config.NETWORK_NAME,
  processAvailable: typeof process !== 'undefined',
  envVars: typeof process !== 'undefined' ? {
    REACT_APP_NODE_BACKEND_URL: process.env?.REACT_APP_NODE_BACKEND_URL,
    REACT_APP_PYTHON_BACKEND_URL: process.env?.REACT_APP_PYTHON_BACKEND_URL
  } : 'process not available'
});

export default config; 