/**
 * API Configuration
 * Toggle between development (localhost) and production (live) environments
 */

// Set this to 'development' for localhost or 'production' for live server
const ENV_MODE: 'development' | 'production' = 'development';

const CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:5000',
    WS_URL: 'ws://localhost:5000/ws/dashboard',
  },
  production: {
    API_BASE_URL: 'http://localhost:5000',
    WS_URL: 'ws://localhost:5000/ws/dashboard',
  },
};

// Export the current environment configuration
export const API_BASE_URL = CONFIG[ENV_MODE].API_BASE_URL;
export const WS_URL = CONFIG[ENV_MODE].WS_URL;

// Export mode for debugging purposes
export const CURRENT_MODE = ENV_MODE;