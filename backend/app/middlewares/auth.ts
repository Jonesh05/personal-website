import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken, verifyAdminRole } from '../db/firebaseAdmin';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware para verificar token de autenticación
export const authenticateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acceso requerido' 
      });
    }

    const decodedToken = await verifyAuthToken(token);
    
    // Verificar si es admin
    const isAdmin = await verifyAdminRole(decodedToken.uid);
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Solo administradores.' 
      });
    }

    // Agregar información del usuario al request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: 'admin'
    };

    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    return res.status(401).json({ 
      error: 'Token inválido o expirado' 
    });
  }
};

// Middleware específico para operaciones de escritura
export const requireAdmin = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Este middleware se ejecuta después de authenticateToken
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Privilegios de administrador requeridos' 
    });
  }
  next();
};