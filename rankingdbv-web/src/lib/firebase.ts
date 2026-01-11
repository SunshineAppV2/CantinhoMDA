
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// Enable Offline Persistence (Multi-Tab) - Modern Approach
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Initialize Firestore with modern cache settings
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

export const storage = getStorage(app);


export default app;
