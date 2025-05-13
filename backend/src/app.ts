import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware';
import config from './config/config';

/**
 * Create Express application
 */
const createApp = (): Express => {
  const app = express();

  // Middleware
  app.use(cors()); // Enable CORS for all routes
  app.use(express.json()); // Parse JSON request body
  app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request body
  
  // Logging middleware
  if (config.server.env === 'development') {
    app.use(morgan('dev')); // Log requests in development
  } else {
    app.use(morgan('combined')); // More detailed logs in production
  }

  // API Routes
  app.use('/api', routes);
  
  // Health check at root
  app.get('/', (req, res) => {
    res.status(200).json({ message: 'SAT Practice API is running' });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;