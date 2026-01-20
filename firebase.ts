
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAmt5ajiUJDdbxgli9n8EpQpw-wHLf_04g",
  authDomain: "plated-e7c72.firebaseapp.com",
  projectId: "plated-e7c72",
  storageBucket: "plated-e7c72.firebasestorage.app",
  messagingSenderId: "772841880864",
  appId: "1:772841880864:web:8e15f94804254aa796ab45"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
