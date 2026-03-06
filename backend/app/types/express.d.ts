import * as express from 'express';

declare global {
  namespace Express {
    interface User {
      uid: string;
      email: string;
      role: string;
      displayName?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
