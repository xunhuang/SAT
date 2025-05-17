# SAT Practice Application

This project provides a web application for practicing SAT questions with both frontend and backend components.

## Project Structure

- `/frontend` - React frontend built with TypeScript and Vite
- `/backend` - Node.js/Express API server
- `/data` - SAT question data in JSON format
- `/download` - Scripts for downloading SAT questions from College Board

## Features

- Google authentication
- Health checks and API status monitoring
- Protected routes requiring authentication
- Typescript support in both frontend and backend

## Setup Instructions

### Prerequisites

- Node.js v18+ and npm
- Firebase account
- Firebase service account key for backend

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Set up Firebase service account:
- From Firebase Console > Project Settings > Service accounts
- Generate new private key
- Save as `src/config/serviceAccountKey.json`

5. Start the development server:
```bash
npm run dev
```

The API will be available at: http://localhost:4000/api

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

### Running Both Concurrently

You can run both frontend and backend concurrently:

1. Start the backend:
```bash
cd backend && npm run dev
```

2. In another terminal, start the frontend:
```bash
cd frontend && npm run dev
```

## Development

### Backend Development

The backend uses Express.js with TypeScript and includes:
- API routes with Express Router
- Firebase Admin SDK integration
- Health check endpoints
- Error handling middleware
- Authentication middleware

### Frontend Development

The frontend is built with:
- React with TypeScript
- Firebase authentication
- Protected routes
- API integration
- Vite for fast development

## Data Source

The project includes scripts for downloading SAT questions from College Board's question bank API. These scripts are located in the `/download` directory.

## Deployment

### Backend Deployment

Build the TypeScript code:
```bash
cd backend && npm run build
```

Start the production server:
```bash
npm start
```

### Frontend Deployment

Build the frontend for production:
```bash
cd frontend && npm run build
```

The build output will be in the `dist` directory, which can be deployed to any static hosting service.