import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs, where, addDoc, updateDoc, onSnapshot, deleteDoc, runTransaction, deleteField, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export { arrayUnion };

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

export const updateUserProfile = async (uid: string, updates: any) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, updates, { merge: true });
};

export const forfeitAccount = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    prideScore: 0,
    title: deleteField(),
    country: deleteField(),
    stats: {
      bombsExploded: 0,
      heartsFound: 0,
      peakPrideScore: 0,
      totalGames: 0,
      wins: 0
    }
  });
};

export const getLeaderboard = async (limitCount: number = 5) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("prideScore", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
};

// --- Matchmaking & Real-time Room Sync ---

export const findOrCreateRoom = async (userProfile: any) => {
  const roomsRef = collection(db, "rooms");

  // First query for an available room
  const q = query(roomsRef, where("status", "==", "waiting"), limit(1));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const roomId = snap.docs[0].id;
    const roomRef = doc(db, "rooms", roomId);

    try {
      const result = await runTransaction(db, async (transaction) => {
        const freshSnap = await transaction.get(roomRef);
        if (!freshSnap.exists()) return null;
        const roomData = freshSnap.data();

        if (roomData.status === "waiting") {
          const updatedPlayers = [...roomData.players, userProfile];
          transaction.update(roomRef, {
            players: updatedPlayers,
            status: "playing",
            lastUpdate: serverTimestamp()
          });
          return { roomId, playerIdx: 1 };
        }
        return null;
      });
      if (result) return result;
    } catch (e) {
      console.warn("Transaction failed, retrying...", e);
    }
  }

  // If no room found or transaction failed/skipped, create a new one
  const roomDoc = await addDoc(roomsRef, {
    players: [userProfile],
    status: "waiting",
    p1Traps: {},
    p2Traps: {},
    openedCups: [],
    currentPlayerIdx: 0,
    readyPlayers: [],
    createdAt: serverTimestamp(),
    lastUpdate: serverTimestamp()
  });
  return { roomId: roomDoc.id, playerIdx: 0 };
};

export const updateRoom = async (roomId: string, updates: any) => {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    ...updates,
    lastUpdate: serverTimestamp()
  });
};

export const listenToRoom = (roomId: string, callback: (data: any) => void) => {
  return onSnapshot(doc(db, "rooms", roomId), (doc) => {
    if (doc.exists()) {
      callback({ ...doc.data(), id: doc.id });
    } else {
      callback(null);
    }
  });
};

export const leaveRoom = async (roomId: string) => {
  // Simple cleanup: delete the room if a player leaves
  // In a real app, you might want to mark it as abandoned
  try {
    await deleteDoc(doc(db, "rooms", roomId));
  } catch (e) {
    console.error("Error leaving room", e);
  }
};