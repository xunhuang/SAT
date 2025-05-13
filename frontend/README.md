# SAT Practice Application

This is a web application for practicing SAT questions.

## Features

- Google authentication for user login
- Protected routes that require authentication
- SAT question browser (upcoming)

## Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
2. Install dependencies:

```bash
cd frontend
npm install
```

3. Configure Firebase

You need to set up a Firebase project:

- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project
- Enable Authentication with Google provider
- Enable Firestore Database
- Add a web app to your project
- Copy the Firebase configuration values

4. Update the Firebase configuration

Open `src/firebase.ts` and replace the placeholder values with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

5. Run the development server:

```bash
npm run dev
```

6. Open your browser and navigate to http://localhost:5173

## Development

The application is built with:

- React
- TypeScript
- Firebase Authentication
- Firebase Firestore (upcoming)
- Vite

## Project Structure

- `/src` - Source code
  - `/components` - React components
  - `/firebase.ts` - Firebase configuration
  - `/App.tsx` - Main application component
  - `/main.tsx` - Application entry point