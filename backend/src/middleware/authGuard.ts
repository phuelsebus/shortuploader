import { Request, Response, NextFunction } from 'express';
import { getToken } from '../utils/tokenStore';
import { Platform } from '../types';

export function requirePlatformAuth(platform: Platform) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const token = getToken(platform);
    if (!token) {
      res.status(401).json({
        success: false,
        error: `Not authenticated with ${platform}. Please connect your account first.`,
      });
      return;
    }
    next();
  };
}
