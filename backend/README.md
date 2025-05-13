# SAT Practice API Backend

This is the backend API for the SAT Practice application.

## Features

- Health check API
- Firebase authentication integration
- TypeScript support
- Error handling middleware
- Development and production configurations

## Setup

### Prerequisites

- Node.js v18+ and npm
- Firebase project (for authentication)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your specific configuration.

3. Firebase service account setup:
- Go to the Firebase Console > Project Settings > Service accounts
- Click "Generate new private key"
- Save the file as `serviceAccountKey.json` in the `src/config` directory

### Development

Start the development server with hot reloading:
```bash
npm run dev
```

### Production Build

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Health Check

- `GET /api/health` - Returns detailed health information about the server
- `GET /api/health/ready` - Simple readiness check endpoint
- `GET /` - Simple check that the API is running

## Project Structure

```
src/
├── config/         # Application configuration
├── controllers/    # Route controllers
├── middlewares/    # Custom middlewares
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Utility functions
├── app.ts          # Express application setup
└── index.ts        # Entry point
```

## Technologies

- Express.js - Web framework
- TypeScript - Type safety
- Firebase Admin - Authentication and database
- Morgan - HTTP request logger
- dotenv - Environment variable management