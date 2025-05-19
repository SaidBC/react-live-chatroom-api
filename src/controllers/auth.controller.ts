import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { setUserTokenCookie } from '../utils/userTokenCookie';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    // Validate input
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        username
      }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this username already exists' });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        role: Role.MEMBER
      }
    });

    // Generate token
    const token = generateToken(user);

    // Return user data
    const userData = user;
    
    return res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    // Validate input
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Set user token cookie
    setUserTokenCookie(res, {
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // Return user data
    const userData = user;
    
    return res.status(200).json({
      message: 'Login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { username } = req.body;

    // Check if username is already taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: req.user.userId }
        }
      });

      if (existingUser) {
        return res.status(409).json({ message: 'Username is already taken' });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        username
      },
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Password change functionality removed as the User model doesn't have a password field
