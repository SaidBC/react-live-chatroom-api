import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateAPIToken, JwtAPIPayloadType } from '../utils/jwt';
import tryCatch from '../utils/tryCatch';

const prisma = new PrismaClient();

/**
 * Generate a user API token
 * @param req Request object
 * @param res Response object
 */
export const generateUserToken = tryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, permissions } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Fetch the user to get their username and role
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create the token payload
  const userPayload = {
    userId: user.id,
    username: user.username,
    role: user.role as "MEMBER" | "MODERATOR"
  };

  // Generate the token
  const token = generateAPIToken(userPayload, JwtAPIPayloadType.USER);

  // Store the token in the database (optional)
  const apiToken = await prisma.apiToken.create({
    data: {
      token,
      userId: user.id,
      type: 'USER',
      permissions: permissions || {},
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }
  });

  // Return the token
  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    },
    expiresAt: apiToken.expiresAt
  });
});

/**
 * Generate a client API token
 * @param req Request object
 * @param res Response object
 */
export const generateClientToken = tryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'User ID and email are required' });
  }

  // Fetch the user to verify they exist and are an admin
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Any user can generate client tokens
  // No role check required

  // Create the token payload
  const clientPayload = {
    userId: user.id,
    email
  };

  // Generate the token
  const token = generateAPIToken(clientPayload, JwtAPIPayloadType.CLIENT);

  // Store the token in the database (optional)
  const apiToken = await prisma.apiToken.create({
    data: {
      token,
      userId: user.id,
      type: 'CLIENT',
      permissions: { fullAccess: true },
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }
  });

  // Return the token
  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    },
    expiresAt: apiToken.expiresAt
  });
});

/**
 * Revoke an API token
 * @param req Request object
 * @param res Response object
 */
export const revokeToken = tryCatch(async (req: Request, res: Response, next: NextFunction) => {
  const { tokenId } = req.params;

  if (!tokenId) {
    return res.status(400).json({ error: 'Token ID is required' });
  }

  // Find the token
  const token = await prisma.apiToken.findUnique({
    where: { id: tokenId }
  });

  if (!token) {
    return res.status(404).json({ error: 'Token not found' });
  }

  // Revoke the token
  await prisma.apiToken.update({
    where: { id: tokenId },
    data: { revoked: true }
  });

  res.status(200).json({ message: 'Token revoked successfully' });
});
