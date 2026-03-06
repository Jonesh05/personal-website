import cookieParser from 'cookie-parser'
// @ts-ignore: Cannot find module 'csurf' or its corresponding type declarations.
import csurf from 'csurf'
import { Express } from 'express';

export function applySecurityMiddlewares(app: Express) {
  app.use(cookieParser(process.env.COOKIE_SECRET || 'default-secret'));

  // Optional CSRF protection for admin routes only
  const csrfProtection = csurf({
    cookie: {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    }
    });
}
