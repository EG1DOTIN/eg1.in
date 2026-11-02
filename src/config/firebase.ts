import { FirebaseAppConfig } from 'eg-web-core';

/**
 * Site-specific Firebase credentials for eg1.in portal.
 */
export const EG1_FIREBASE_CONFIG: FirebaseAppConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'AIzaSyAdniLkdFBjIGKotTy-JUeXnrbAQSzbiGM',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || 'eg1-admin.firebaseapp.com',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || 'eg1-admin',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || 'eg1-admin.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '130172618069',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '1:130172618069:web:927b97a603635e58c3dbdc',
};
