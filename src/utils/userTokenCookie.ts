import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserPayload } from './jwt';

const JWT_SECRET = process.env.JWT_API_SECRET || 'your-secret-key';
const COOKIE_NAME = 'user_api_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  sameSite: 'strict' as const,
  path: '/'
};

/**
 * Generate a user token and store it in a cookie
 * @param res Express response object
 * @param user User payload
 */
export const setUserTokenCookie = (res: Response, user: UserPayload): void => {
  const token = jwt.sign(
    { 
      userId: user.userId,
      username: user.username,
      role: user.role,
      type: 'USER'
    },
    JWT_SECRET as jwt.Secret,
    { expiresIn: '30d' }
  );

  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
};

/**
 * Get user token from cookie
 * @param req Express request object
 * @returns User payload or null
 */
export const getUserTokenFromCookie = (req: Request): UserPayload | null => {
  const token = req.cookies[COOKIE_NAME];
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Clear user token cookie
 * @param res Express response object
 */
export const clearUserTokenCookie = (res: Response): void => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
};
