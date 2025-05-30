import { Request, Response, NextFunction } from "express";
import { verifyAPIToken, JwtAPIPayload, JwtAPIPayloadType } from "../utils/jwt";
import getToken from "../utils/getToken";
import { getUserTokenFromCookie } from "../utils/userTokenCookie";

export interface ApiAuthRequest extends Request {
  apiUser?: JwtAPIPayload;
  user?: {
    userId: string;
    username?: string;
    email?: string;
    role?: string;
    type: JwtAPIPayloadType;
  };
}

/**
 * Middleware to authenticate API requests using tokens
 */
export const authenticateApiToken = (
  req: ApiAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Development bypass - only use in development/testing
    if (process.env.NODE_ENV !== 'production' && process.env.BYPASS_AUTH === 'true') {
      req.apiUser = {
        userId: 'dev-user',
        username: 'developer',
        role: 'admin',
        type: JwtAPIPayloadType.USER,
        permissions: {
          read: true,
          write: true,
          delete: true,
          rooms: [],
        },
      };
      return next();
    }
    
    // Check query parameter token (useful for cross-origin scenarios)
    const queryToken = req.query.token as string;
    if (queryToken) {
      try {
        const decoded = verifyAPIToken(queryToken);
        req.apiUser = decoded;
        return next();
      } catch (e) {
        console.log('Invalid query token, continuing to other auth methods');
      }
    }
    
    // Check for token in Authorization header
    const token = getToken(req);
    if (token) {
      const decoded = verifyAPIToken(token);
      req.apiUser = decoded;
      return next();
    }

    // Check for user token in cookies
    const userFromCookie = getUserTokenFromCookie(req);
    if (userFromCookie) {
      req.apiUser = {
        userId: userFromCookie.userId,
        username: userFromCookie.username,
        role: userFromCookie.role,
        type: JwtAPIPayloadType.USER,
        permissions: {
          read: true,
          write: true,
          delete: false,
          rooms: [],
        },
      };
      return next();
    }
    
    // For Cloudflare environment - temporary public access
    if (req.headers.host?.includes('cloudflare') && req.method === 'GET') {
      console.log('Allowing public access for GET requests in Cloudflare environment');
      req.apiUser = {
        userId: 'public-user',
        username: 'public',
        role: 'user',
        type: JwtAPIPayloadType.USER,
        permissions: {
          read: true,
          write: false,
          delete: false,
          rooms: [],
        },
      };
      return next();
    }

    // No token found in any location
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

/**
 * Middleware to authorize client tokens
 */
export const authorizeClient = (
  req: ApiAuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.apiUser || req.apiUser.type !== JwtAPIPayloadType.CLIENT) {
    return res.status(403).json({ error: "Forbidden: Client access required" });
  }
  next();
};

/**
 * Middleware to authenticate and authorize client tokens in one step
 * This combines authenticateApiToken and authorizeClient
 */
export const authenticateClientToken = [
  authenticateApiToken,
  authorizeClient
];

/**
 * Middleware to check if the user has access to a specific room
 * Client tokens have access to all rooms
 * User tokens only have access to rooms they are members of
 */
export const authorizeRoomAccess = (prisma: any) => {
  return async (req: ApiAuthRequest, res: Response, next: NextFunction) => {
    try {
      const { apiUser } = req;
      const roomId = req.params.roomId || req.params.id;

      if (!apiUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Client tokens have access to all rooms
      if (apiUser.type === JwtAPIPayloadType.CLIENT) {
        return next();
      }

      // For user tokens, check if the user is a member of the room
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          users: {
            some: {
              id: apiUser.userId,
            },
          },
        },
      });

      if (!room) {
        return res.status(403).json({
          error: "Forbidden: You don't have access to this room",
        });
      }

      next();
    } catch (error) {
      console.error("Room access authorization error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
};
