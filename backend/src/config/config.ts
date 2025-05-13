import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 4000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // Firebase configuration
  firebase: {
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://sattest-eaadc.firebaseio.com',
    // Path to the service account key file
    serviceAccountKeyPath: path.resolve(__dirname, './serviceAccountKey.json'),
  },
};

export default config;