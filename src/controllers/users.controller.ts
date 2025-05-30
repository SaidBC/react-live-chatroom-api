import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiAuthRequest } from '../middleware/apiAuth';
import { generateAPIToken, JwtAPIPayloadType } from '../utils/jwt';

const prisma = new PrismaClient();

/**
 * Get all users
 */
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Create a new user
 * Requires a client token for authorization
 */
export const createUser = async (req: ApiAuthRequest, res: Response) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  try {
    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create the user
    const user = await prisma.user.create({
      data: { 
        username,
        role: 'MEMBER' 
      }
    });
    
    // Create user payload for token
    const userPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as "MEMBER" | "MODERATOR"
    };

    // Generate user token
    const token = generateAPIToken(userPayload, JwtAPIPayloadType.USER);

    // Store the token in the database
    const apiToken = await prisma.apiToken.create({
      data: {
        token,
        userId: user.id,
        type: 'USER',
        permissions: { read: true, write: true },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });
    
    // Return user with token
    res.status(201).json({
      user,
      token,
      expiresAt: apiToken.expiresAt
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};
