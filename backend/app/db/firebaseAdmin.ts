import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Configuración del service account
const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
};

// Inicializar Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    const hasCredentials = !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    );

    // Si estamos en entorno de desarrollo local, forzar el uso del emulador
    if (!hasCredentials || process.env.NODE_ENV === 'development') {
      process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8081';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
      
      console.log('Inicializando Firebase Admin en modo emulador');
      initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'portfolio-website-668ce' });
    } else {
      initializeApp({ credential: cert(serviceAccount), projectId: process.env.FIREBASE_PROJECT_ID });
    }
  }
};

initializeFirebaseAdmin();

// Exportar servicios
export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Middleware de autenticación para verificar tokens
export const verifyAuthToken = async (token: string) => {
  try {
    try {
      // First try verifying it as a Next.js Session Cookie
      return await adminAuth.verifySessionCookie(token, true);
    } catch (e) {
      // If it fails, fallback to verifying as a standard ID Token
      return await adminAuth.verifyIdToken(token);
    }
  } catch (error) {
    console.error('Error verificando token:', error);
    throw new Error('Token inválido');
  }
};

// Verificar si el usuario es admin
export const verifyAdminRole = async (uid: string, email?: string): Promise<boolean> => {
  try {
    // Check against authorized admin emails first to avoid relying on empty local emulator DB
    const adminEmails = [
      process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      'newrevolutiion@gmail.com',
      'jhonny.pimiento@gmail.com'
    ].filter(Boolean);

    if (email && adminEmails.includes(email)) {
      return true;
    }

    // Fallback to Firestore lookup
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error verificando rol admin:', error);
    return false;
  }
};