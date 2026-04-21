import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const defaultFirebaseConfig = {
  apiKey: "AIzaSyCqi_zfIu9feRAxQ8t6dlFszD9mK1DNGWk",
  authDomain: "gratitudesharing-faaec.firebaseapp.com",
  projectId: "gratitudesharing-faaec",
  storageBucket: "gratitudesharing-faaec.firebasestorage.app",
  messagingSenderId: "70290514704",
  appId: "1:70290514704:web:cf954f0e1edfc574127b95",
  measurementId: "G-RFTNZQZXM4",
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? defaultFirebaseConfig.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? defaultFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? defaultFirebaseConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ??
    defaultFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? defaultFirebaseConfig.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ??
    defaultFirebaseConfig.measurementId,
};

const requiredKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

export const missingFirebaseEnv = requiredKeys.filter(
  (key) => !import.meta.env[key] && !firebaseConfigForEnvKey(key),
);

export const isFirebaseConfigured = missingFirebaseEnv.length === 0;

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

export const db = app ? getFirestore(app) : null;

export const analyticsPromise: Promise<Analytics | null> = app
  ? isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null)
  : Promise.resolve(null);

function firebaseConfigForEnvKey(key: (typeof requiredKeys)[number]) {
  const configByEnvKey = {
    VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
    VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
    VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
    VITE_FIREBASE_APP_ID: firebaseConfig.appId,
  };

  return configByEnvKey[key];
}
