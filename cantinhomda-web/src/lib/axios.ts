import axios from 'axios';
import { safeLocalStorage } from './storage';

export const api = axios.create({
    // Prioritize Env Var, then LocalStorage, then Hardcoded Localhost (SAFE DEFAULT for now)
    // The previous window.location.hostname logic fails on production domain if backend is local
    baseURL: import.meta.env.VITE_API_URL || safeLocalStorage.getItem('api_url') || 'http://localhost:3000',
});

console.log('[Axios] API BaseURL:', api.defaults.baseURL);

import { auth } from './firebase';

api.interceptors.request.use(async (config) => {
    // 0. If Authorization is already set, don't overwrite it (e.g., MFA temp tokens or manual overrides)
    if (config.headers.Authorization) {
        return config;
    }

    // 1. Try Backend Token (JWT)
    const token = safeLocalStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        // 2. Fallback to Firebase (Identity) Token
        const user = auth.currentUser;
        if (user) {
            const fbToken = await user.getIdToken();
            // Note: Backend might reject this if not configured for Firebase Admin, 
            // but we keep it for now as a fallback or for firebase-services.
            config.headers.Authorization = `Bearer ${fbToken}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Expected 401 when not authenticated - no action needed
            console.log('Unauthorized access (401) - user not authenticated');
            // safeLocalStorage.removeItem('token');
            // safeLocalStorage.removeItem('user');
            // Do not force redirect/reload to avoid loops. Let the UI handle the error.
        }
        return Promise.reject(error);
    }
);
