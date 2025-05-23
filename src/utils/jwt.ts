import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_API_SECRET = process.env.JWT_API_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

export interface UserPayload {
  userId: string;
  username: string;
  role: string;
}

export enum JwtAPIPayloadType {
  CLIENT,
  USER,
}

interface ClientPayload {
  userId: string;
  email: string;
}
interface JwtAPIPayloadClient extends ClientPayload {
  type: JwtAPIPayloadType.CLIENT;
}
interface JwtAPIPayloadUser extends UserPayload {
  type: JwtAPIPayloadType.USER;
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    rooms: string[];
  };
}
export type JwtAPIPayload = JwtAPIPayloadClient | JwtAPIPayloadUser;

export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

type generateAPITokenClient = (
  userOrClient: ClientPayload,
  type: JwtAPIPayloadType.CLIENT
) => string;
type generateAPITokenUser = (
  userOrClient: UserPayload,
  type: JwtAPIPayloadType.USER
) => string;
type generateAPITokenType = generateAPITokenClient | generateAPITokenUser;

export const generateAPIToken = (
  userOrClient: UserPayload | ClientPayload,
  type: JwtAPIPayloadType
): string => {
  let payload: JwtAPIPayload | null = null;
  
  if (type === JwtAPIPayloadType.USER && 'username' in userOrClient && 'role' in userOrClient) {
    payload = {
      userId: userOrClient.userId,
      username: userOrClient.username,
      role: userOrClient.role,
      type: JwtAPIPayloadType.USER,
    };
  } else if (type === JwtAPIPayloadType.CLIENT && 'email' in userOrClient) {
    payload = {
      userId: userOrClient.userId,
      email: userOrClient.email,
      type: JwtAPIPayloadType.CLIENT,
    };
  }
  
  if (payload === null) throw new Error("Invalid payload for token generation");
  
  return jwt.sign(payload, JWT_API_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as SignOptions);
};

export const verifyAPIToken = (token: string): JwtAPIPayload => {
  try {
    return jwt.verify(token, JWT_API_SECRET) as JwtAPIPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
