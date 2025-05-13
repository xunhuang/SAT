import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANT: Replace these placeholder values with your actual Firebase configuration
// This is a placeholder configuration - You need to replace these with your actual Firebase config values
// You can get these values from the Firebase console (https://console.firebase.google.com/)
const firebaseConfig = {
  apiKey: "AIzaSyCpO9XgoC-bMAuFQBentBL2kdynUMb0Ld8",
  authDomain: "sattest-eaadc.firebaseapp.com",
  projectId: "sattest-eaadc",
  storageBucket: "sattest-eaadc.firebasestorage.app",
  messagingSenderId: "373993291990",
  appId: "1:373993291990:web:e12d102885562ec8bf4977",
  measurementId: "G-90DFD8PJH3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };