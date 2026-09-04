// Firebase Configuration
// Initialize Firebase with your Spark Plan credentials
// Get these from Firebase Console > Project Settings

const firebaseConfig = {
  apiKey: "AIzaSyAdniLkdFBjIGKotTy-JUeXnrbAQSzbiGM",
  authDomain: "eg1-admin.firebaseapp.com",
  projectId: "eg1-admin",
  storageBucket: "eg1-admin.firebasestorage.app",
  messagingSenderId: "130172618069",
  appId: "1:130172618069:web:c9519b928e3d1a2cc3dbdc"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = typeof firebase.storage === 'function' ? firebase.storage() : null;
const analytics = typeof firebase.analytics === 'function' ? firebase.analytics() : null;

console.log('Firebase initialized successfully');
