
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Enable Offline Persistence (Multi-Tab) - Modern Approach
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Re-initialize Firestore with Cache Settings
// Note: We are overwriting the 'db' export essentially, but since we can't redeclare, we change how it's initialized.
// Actually, getFirestore() returns the existing instance if already initialized. 
// Correct pattern is to use initializeFirestore INSTEAD of getFirestore if we want custom settings.

// REMOVE export const db = getFirestore(app); and replace with:


export default app;
