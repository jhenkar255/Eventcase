import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { User } from '../models/User';

export interface OptionalAuthRequest extends Request {
  user?: { id: string; role: string };
}

/**
 * Attaches req.user if a valid token is provided, but never blocks the request.
 */
export const optionalAuth = async (req: OptionalAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split(' ')[1]);
      const user = await User.findById(decoded.id).select('status role');
      if (user && user.status === 'active') {
        req.user = { id: String(user._id), role: user.role };
      }
    }
  } catch {
    // ignore invalid tokens for public routes
  }
  next();
};
