// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import { getAuth }  from "firebase/auth";
import { getFirestore } from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbIRV7QdCItdExGhRtrV9vt5pvAk08vEk",
  authDomain: "brailleproject-fe085.firebaseapp.com",
  projectId: "brailleproject-fe085",
  storageBucket: "brailleproject-fe085.firebasestorage.app",
  messagingSenderId: "642863710549",
  appId: "1:642863710549:web:c828d20d43d539bcb52fdc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };