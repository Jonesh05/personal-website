import { Response } from 'express';

export const SESSION_COOKIE_NAME = 'session';
export const CSRF_COOKIE_NAME = 'csrf';

/*export function setSessionCookies(res: Response, sessionToken: string, email?: string, maxAge = 7 * 24 * 60 * 60 * 1000) {
  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  if (email) {
    res.cookie('admin_email', email, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });
  }

  res.cookie('admin_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  })
  res.cookie('is_admin', 'true', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  })

  // Optional CSRF token (non-httpOnly) for client to read
  const csrf = generateRandomToken();
  res.cookie(CSRF_COOKIE_NAME, csrf, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  return csrf;
}*/
export function setSessionCookies(
  res: Response,
  sessionToken: string,
  email?: string,
  maxAge = 7 * 24 * 60 * 60 * 1000
) {
  const isProd = process.env.NODE_ENV === 'production';
  
  // Para entornos con frontend y backend en dominios distintos (localhost:3000 y 127.0.0.1:5001)
  const sameSiteValue = isProd ? 'none' : 'lax';

  res.cookie(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: isProd && process.env.FORCE_SECURE_COOKIE !== 'false', // ⚡ permite forzar secure=false en dev
    sameSite: sameSiteValue,
    maxAge,
    path: '/',
  });

  if (email) {
    res.cookie('admin_email', email, {
      httpOnly: false,
      secure: isProd && process.env.FORCE_SECURE_COOKIE !== 'false',
      sameSite: sameSiteValue,
      maxAge,
      path: '/',
    });
  }

  res.cookie('admin_token', sessionToken, {
    httpOnly: true,
    secure: isProd && process.env.FORCE_SECURE_COOKIE !== 'false',
    sameSite: sameSiteValue,
    maxAge,
    path: '/',
  });

  res.cookie('is_admin', 'true', {
    httpOnly: false,
    secure: isProd && process.env.FORCE_SECURE_COOKIE !== 'false',
    sameSite: sameSiteValue,
    maxAge,
    path: '/',
  });

  const csrf = generateRandomToken();
  res.cookie(CSRF_COOKIE_NAME, csrf, {
    httpOnly: false,
    secure: isProd && process.env.FORCE_SECURE_COOKIE !== 'false',
    sameSite: sameSiteValue,
    maxAge,
    path: '/',
  });

  return csrf;
}


export function clearSessionCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.clearCookie('admin_email', { path: '/' });
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
}

function generateRandomToken(length = 32) {
  return [...Array(length)].map(()=> (Math.floor(Math.random()*36)).toString(36)).join('');
}