/**
 * Configuración del cliente de Firebase para el lado del frontend.
 * Este archivo inicializa la app de Firebase para ser usada en componentes de cliente.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
// Importa los servicios que necesites, ej: import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase de tu web app. 
// Es seguro exponer estas claves en el cliente.
// Para mayor seguridad, cárgalas desde variables de entorno.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa Firebase, evitando re-inicializaciones en el HMR de Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta la app y otros servicios que inicialices
// const db = getFirestore(app);

export { app /*, db */ };
