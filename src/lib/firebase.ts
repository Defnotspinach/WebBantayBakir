import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCXB7qnzr56uEN1L6EME-jJ978fZ6sBTw",
  authDomain: "bantaybakir-618b5.firebaseapp.com",
  projectId: "bantaybakir-618b5",
  storageBucket: "bantaybakir-618b5.firebasestorage.app",
  messagingSenderId: "456222560151",
  appId: "1:456222560151:web:990235220d6cf8db61bed2",
  measurementId: "G-62H8C63M4P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
