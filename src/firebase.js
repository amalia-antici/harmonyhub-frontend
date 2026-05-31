import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDGq2J9wnt3qOTjed7Sx_DZXwjR2TP4y8",
  authDomain: "harmonyhubchat.firebaseapp.com",
  databaseURL: "https://harmonyhubchat-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "harmonyhubchat",
  storageBucket: "harmonyhubchat.firebasestorage.app",
  messagingSenderId: "520953154260",
  appId: "1:520953154260:web:62da2e7634b804d8c98941"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);