import { Request, Response } from 'express';
import { adminAuth } from '../db/firebaseAdmin';
import { setSessionCookies, clearSessionCookies } from '../utils/cookie.helper';

const EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function sessionLogin(req: Request, res: Response) {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    
    // ✅ VALIDACIÓN: Solo permitir email específico
    if (decoded.email !== 'newrevolutiion@gmail.com') {
      return res.status(403).json({ error: 'Unauthorized email' });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN });
    const sessionDecoded = await adminAuth.verifySessionCookie(sessionCookie).catch(()=>null);

    const csrf = setSessionCookies(res, sessionCookie, sessionDecoded?.email, EXPIRES_IN);
    return res.json({ ok: true, csrf });
  } catch (err) {
    console.error('sessionLogin error', err);
    return res.status(401).json({ error: 'Invalid idToken' });
  }
}

export async function sessionLogout(req: Request, res: Response) {
  try {
    const token = req.cookies?.session;
    if (token) {
      const decoded = await adminAuth.verifySessionCookie(token).catch(()=>null);
      if (decoded) await adminAuth.revokeRefreshTokens(decoded.uid);
    }
  } catch (err) {
    console.warn('sessionLogout revoke failed', err);
  } finally {
    clearSessionCookies(res);
    return res.json({ ok: true });
  }
}

export async function sessionRefresh(req: Request, res: Response) {
  return sessionLogin(req, res);
}

export async function verifySession(req: Request, res: Response) {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: 'No session cookie found' });

    const decoded = await adminAuth.verifySessionCookie(token, true);

    // Opcional: puedes obtener más info del usuario desde Firestore si quieres
    return res.status(200).json({
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.email === 'newrevolutiion@gmail.com' ? 'admin' : 'user',
      },
    });
  } catch (err) {
    console.error('verifySession error', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
