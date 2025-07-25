// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyDvdzEJrAYEYlNoowjLUu_L_j5BNhyhZ4I",
  authDomain: "coffeepoint-24c04.firebaseapp.com",
  projectId: "coffeepoint-24c04",
  storageBucket: "coffeepoint-24c04.firebasestorage.app",
  messagingSenderId: "238968837067",
  appId: "1:238968837067:web:0188a5ee655acb1d9fdc4e",
  measurementId: "G-2208LP1SK7"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ambil database Firestore
const db = getFirestore(app);

// Export supaya bisa dipakai di file lain
export { db };