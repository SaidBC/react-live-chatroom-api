import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiAuthRequest } from '../middleware/apiAuth';
import { JwtAPIPayloadType } from '../utils/jwt';

const prisma = new PrismaClient();

/**
 * Get all rooms
 * For client tokens: returns all rooms
 * For user tokens: returns only rooms the user is a member of
 */
export const getAllRooms = async (req: ApiAuthRequest, res: Response) => {
  try {
    const { apiUser } = req;
    
    if (!apiUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // For client tokens, return all rooms
    if (apiUser.type === JwtAPIPayloadType.CLIENT) {
      const rooms = await prisma.room.findMany({
        include: {
          _count: {
            select: {
              messages: true,
              users: true
            }
          }
        }
      });
      return res.json(rooms);
    }
    
    // For user tokens, return only rooms the user is a member of
    const rooms = await prisma.room.findMany({
      where: {
        users: {
          some: {
            id: apiUser.userId
          }
        }
      },
      include: {
        _count: {
          select: {
            messages: true,
            users: true
          }
        }
      }
    });
    
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

/**
 * Create a new room
 */
export const createRoom = async (req: Request, res: Response) => {
  const { name, userId } = req.body;
  
  if (!name || !userId) {
    return res.status(400).json({ error: 'Name and userId are required' });
  }
  
  try {
    const room = await prisma.room.create({
      data: {
        name,
        users: {
          connect: { id: userId }
        }
      }
    });
    
    res.status(201).json(room);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

/**
 * Get a room by ID
 */
export const getRoomById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
};

/**
 * Add a user to a room
 */
export const addUserToRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'UserId is required' });
  }
  
  try {
    // Check if the room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    });
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add the user to the room
    await prisma.room.update({
      where: { id: roomId },
      data: {
        users: {
          connect: { id: userId }
        }
      }
    });
    
    res.status(200).json({ message: 'User added to room successfully' });
  } catch (error) {
    console.error('Error adding user to room:', error);
    res.status(500).json({ error: 'Failed to add user to room' });
  }
};
