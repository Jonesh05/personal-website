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
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
};

initializeFirebaseAdmin();

// Exportar servicios
export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Middleware de autenticación para verificar tokens
export const verifyAuthToken = async (token: string) => {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Token inválido');
  }
};

// Verificar si el usuario es admin
export const verifyAdminRole = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error verificando rol admin:', error);
    return false;
  }
};