import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
export const db = getFirestore(app);
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

export const syncUserProfile = async (user: User, currentScore?: number) => {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data();
  } else {
    const newData = {
      uid: user.uid,
      displayName: user.displayName || 'Warrior',
      photoURL: user.photoURL || 'https://via.placeholder.com/150',
      prideScore: currentScore || 100,
      createdAt: serverTimestamp()
    };
    await setDoc(userRef, newData);
    return newData;
  }
};

export const updateScore = async (uid: string, newScore: number) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, { prideScore: newScore }, { merge: true });
};

export const getLeaderboard = async (limitCount: number = 5) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("prideScore", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data());
};