import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const protect = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      throw ApiError.unauthorized('Please log in to access this resource');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await User.findById(decoded.id).select('status role name email');
    if (!user || user.status === 'deleted') {
      throw ApiError.unauthorized('Account no longer exists');
    }
    if (user.status === 'suspended') {
      throw ApiError.forbidden('Your account has been suspended. Contact support.');
    }

    req.user = { id: String(user._id), role: user.role };
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`Access denied. Required role: ${roles.join(' or ')}`));
      return;
    }
    next();
  };
};
