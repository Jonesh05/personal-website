import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH!)
    ),
  });
}

export const db = admin.firestore(); 