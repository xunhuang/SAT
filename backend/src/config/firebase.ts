import admin from 'firebase-admin';
import fs from 'fs';
import config from './config';

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export const initFirebase = (): void => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Check if service account key file exists
    if (fs.existsSync(config.firebase.serviceAccountKeyPath)) {
      // Initialize with service account
      const serviceAccount = require(config.firebase.serviceAccountKeyPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: config.firebase.databaseURL,
      });
    } else {
      // Initialize without service account (for development only)
      console.warn('Service account key file not found. Initializing Firebase without credentials.');
      console.warn('This should only be used for development purposes.');
      
      admin.initializeApp({
        databaseURL: config.firebase.databaseURL,
      });
    }
    
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
};

/**
 * Get Firebase Admin instance
 */
export const getFirebaseAdmin = (): typeof admin => {
  if (!firebaseInitialized) {
    initFirebase();
  }
  return admin;
};

export default {
  initFirebase,
  getFirebaseAdmin,
};