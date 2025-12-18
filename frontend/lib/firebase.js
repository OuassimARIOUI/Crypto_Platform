import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: "cryptoplatform-3a74f.firebaseapp.com",
    projectId: "cryptoplatform-3a74f",
    storageBucket: "cryptoplatform-3a74f.firebasestorage.app",
    messagingSenderId: "293985364644",
    appId: "1:293985364644:web:41662f71c6d689d4825431"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
