import createApp from './app';
import config from './config/config';
import { initFirebase } from './config/firebase';

// Create Express application
const app = createApp();
const PORT = config.server.port;

// Initialize Firebase Admin SDK
try {
  initFirebase();
} catch (error) {
  console.warn('Failed to initialize Firebase, continuing without Firebase:', error);
}

// Start the server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running in ${config.server.env} mode on port ${PORT}
API URL: http://localhost:${PORT}/api
Health check: http://localhost:${PORT}/api/health
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM signal (e.g., from Heroku)
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});

export default server;