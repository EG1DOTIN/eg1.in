import React from 'react';
import ReactDOM from 'react-dom/client';
import 'eg-web-core/style.css';
import { ThemeProvider, FirebaseProvider, DataCache } from 'eg-web-core';
import { EG1_FIREBASE_CONFIG } from './config/firebase';
import { App } from './App';

// Register application-specific cache and storage prefix
DataCache.registerStoragePrefix('eg1_');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light-gray">
      <FirebaseProvider config={EG1_FIREBASE_CONFIG}>
        <App />
      </FirebaseProvider>
    </ThemeProvider>
  </React.StrictMode>
);
