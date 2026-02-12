import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCw5CdLQtImGFYgJQCiuOCFbDTmg0lIXOI",
  authDomain: "cup-of-risk.firebaseapp.com",
  projectId: "cup-of-risk",
  storageBucket: "cup-of-risk.firebasestorage.app",
  messagingSenderId: "914876817527",
  appId: "1:914876817527:web:7b499f52e0d13058572672",
  measurementId: "G-CFM6K935RE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};