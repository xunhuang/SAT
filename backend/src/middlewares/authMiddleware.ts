import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from '../config/firebase';

// Extend the Express Request interface to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

/**
 * Middleware to verify Firebase authentication token
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Unauthorized - No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    const admin = getFirebaseAdmin();
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ 
      status: 'error',
      message: 'Unauthorized - Invalid token' 
    });
  }
};

/**
 * Optional authentication middleware - doesn't require authentication
 * but attaches user info to request if token is valid
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const admin = getFirebaseAdmin();
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    // Don't throw error, just continue without user info
    console.warn('Invalid token in optional auth, continuing without user info');
  }
  
  next();
};

export default {
  verifyToken,
  optionalAuth,
};