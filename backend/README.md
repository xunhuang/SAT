# SAT Practice API Backend

This is the backend API for the SAT Practice application.

## Features

- Health check API
- Firebase authentication integration
- TypeScript support
- Error handling middleware
- Development and production configurations
- Email notifications for test creation and completion
- Question bank management

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

### Test Generation

- `POST /api/tests/generate` - Generate a new test with questions from the question bank or system bank

### Question Bank

- `GET /api/question-bank/:userId` - Get a user's question bank
- `POST /api/question-bank/:userId/populate` - Populate a user's question bank

### Email Notifications

- `POST /api/email/test-attempt` - Send email notification for completed test attempts

See [API_DOCS.md](./API_DOCS.md) and [EMAIL_DOCS.md](./EMAIL_DOCS.md) for detailed API documentation.

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
- Nodemailer - Email notifications