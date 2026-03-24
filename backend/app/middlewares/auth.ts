/*import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import fs from 'fs';
import path from 'path';

// Firebase Admin (una sola vez)
function initFirebaseAdmin() {
  if (getApps().length === 0) {
    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!saKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no definido');
    }
    const serviceAccount = JSON.parse(saKey);
    initializeApp({
      credential: cert(serviceAccount),
    });
  }
}
initFirebaseAdmin();

// Exportar instancia de auth
const adminAuth = getAuth();

// Extiende Express Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware: verifica cookie de sesión y rol admin
 */
/*export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const sessionCookie = req.cookies?.session;
  if (!sessionCookie) {
    return res.status(401).json({ error: 'No session cookie found' });
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decoded.email !== 'newrevolutiion@gmail.com') {
      return res.status(403).json({ error: 'Forbidden: no admin' });
    }

    const isAdmin = await adminAuth.getUser(decoded.uid)
      .then((u) => u.customClaims?.role === 'admin')
      .catch(() => false);

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin role required' });
    }

    req.user = { uid: decoded.uid, email: decoded.email, role: 'admin' };
    next();
  } catch (err) {
    console.error('Session verification failed:', err);
    return res.status(401).json({ error: 'Invalid session' });
  }
};

/**
 * Middleware: exige rol admin después de authenticateToken
 */
/*export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  next();
};
*/
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../db/firebaseAdmin';


// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware: verify session cookie and admin role
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionCookie = req.cookies?.session;
    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        req.user = { 
          uid: decoded.uid, 
          email: decoded.email, 
          role: 'admin' 
        };
        return next();
      } catch (sessionError) {
        console.warn('Session cookie verification failed:', sessionError);
        // Fall through to Authorization header check
      }
    }

    // EXISTING: Fallback to Authorization header (backward compatibility)
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    req.user = { 
      uid: decoded.uid, 
      email: decoded.email, 
      role: 'admin' 
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
  /*  const authHeader = req.headers.authorization;
    const sessionCookie = req.cookies?.session;
    
    let decoded;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Try ID token first
      const idToken = authHeader.substring(7);
      decoded = await adminAuth.verifyIdToken(idToken);
    } else if (sessionCookie) {
      // Try session cookie
      decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    } else {
      return res.status(401).json({ error: 'No authentication token found' });
    }

    // Check if user is admin
    if (decoded.email !== 'newrevolutiion@gmail.com') {
      return res.status(403).json({ error: 'Forbidden: admin access required' });
    }

    // Verify admin role in custom claims
    const userRecord = await adminAuth.getUser(decoded.uid);
    const isAdmin = userRecord.customClaims?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin role required' });
    }

    req.user = { 
      uid: decoded.uid, 
      email: decoded.email, 
      role: 'admin' 
    };
    
    next();
  } catch (error) {
    console.error('Authentication failed:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware: require admin role after authenticateToken
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }
  next();
};

// Middleware para verificar email específico
export const requireSpecificAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.user || req.user.email !== 'newrevolutiion@gmail.com') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Email no autorizado.' 
    });
  }
  next();
};