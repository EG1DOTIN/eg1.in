/**
 * @file firebase-config.js
 * @description Initializes Firebase Web App SDK and Cloud Firestore service instance for EG1 client app.
 * @project EG1 Website Portal
 */

// Firebase Configuration Object for Public Client Web App
// Note: Public Firebase API keys are safe to expose when Cloud Firestore Security Rules are enabled.
const firebaseConfig = {
  apiKey: "AIzaSyAdniLkdFBjIGKotTy-JUeXnrbAQSzbiGM",
  authDomain: "eg1-admin.firebaseapp.com",
  projectId: "eg1-admin",
  storageBucket: "eg1-admin.firebasestorage.app",
  messagingSenderId: "130172618069",
  appId: "1:130172618069:web:927b97a603635e58c3dbdc"
};

// Initialize main Firebase instance
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore database instance for client queries
const db = firebase.firestore();

console.log('Firebase initialized on WebApp');

