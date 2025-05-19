import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateApiToken, authorizeRoomAccess, ApiAuthRequest } from './middleware/apiAuth';
import { generateUserToken, generateClientToken, revokeToken } from './controllers/tokens.controller';
import { sendMessage, getRoomMessages, getUserMessages, getAllMessages } from './controllers/messages.controller';
import { JwtAPIPayloadType } from './utils/jwt';

/**
 * Sets up all API routes for the chat application
 * 
 * @param {Express} app - Express application instance
 * @param {PrismaClient} prisma - Prisma client for database operations
 */
export function setupRoutes(app: Express, prisma: PrismaClient): void {
  /**
   * GET /api/rooms
   * Retrieves chat rooms from the database
   * For client tokens: returns all rooms
   * For user tokens: returns only rooms the user is a member of
   */
  app.get('/api/rooms', authenticateApiToken, async (req: ApiAuthRequest, res: Response) => {
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
  });

  /**
   * POST /api/rooms
   * Creates a new chat room and associates it with the specified user
   * @requires {name} - Name of the room to create
   * @requires {userId} - ID of the user creating the room
   */
  app.post('/api/rooms', async (req: Request, res: Response) => {
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
  });

  /**
   * GET /api/rooms/:id
   * Retrieves a specific room by ID, including its associated users
   * @param {string} id - Room ID
   */
  app.get('/api/rooms/:id', async (req: Request, res: Response) => {
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
  });

  /**
   * GET /api/users
   * Retrieves all users from the database
   */
  app.get('/api/users', async (_req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  /**
   * POST /api/users
   * Creates a new user
   * @requires {username} - Username for the new user
   */
  app.post('/api/users', async (req: Request, res: Response) => {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    try {
      const user = await prisma.user.create({
        data: { username }
      });
      
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  /**
   * GET /api/rooms/:roomId/messages
   * Retrieves all messages for a specific room, ordered by creation time
   * Client tokens can access all room messages
   * User tokens can only access messages from rooms they are members of
   * @param {string} roomId - Room ID
   */
  // Use the controller for getting room messages
  app.get('/api/rooms/:roomId/messages', authenticateApiToken, getRoomMessages);
  
  /**
   * POST /api/rooms/:roomId/messages
   * Sends a new message to a room
   * Client tokens can send to any room
   * User tokens can only send to rooms they are members of
   * @param {string} roomId - Room ID
   * @requires {content} - Message content
   */
  app.post('/api/rooms/:roomId/messages', authenticateApiToken, sendMessage);

  /**
   * POST /api/rooms/:roomId/users
   * Adds a user to a specific room
   * @param {string} roomId - Room ID
   * @requires {userId} - ID of the user to add to the room
   */
  app.post('/api/rooms/:roomId/users', async (req: Request, res: Response) => {
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
  });
  
  /**
   * GET /api/messages/user
   * Gets all messages sent by the authenticated user
   * Requires API token authentication
   */
  app.get('/api/messages/user', authenticateApiToken, getUserMessages);
  
  /**
   * GET /api/messages
   * Gets all messages across all rooms
   * Requires client token authentication
   */
  app.get('/api/messages', authenticateApiToken, getAllMessages);
  
  /**
   * POST /api/tokens/user
   * Generates a user API token
   * @requires {userId} - ID of the user to generate a token for
   * @requires {permissions} - Optional permissions object
   */
  app.post('/api/tokens/user', generateUserToken);
  
  /**
   * POST /api/tokens/client
   * Generates a client API token (admin only)
   * @requires {userId} - ID of the user to generate a token for
   * @requires {email} - Email associated with the client
   */
  app.post('/api/tokens/client', generateClientToken);
  
  /**
   * PUT /api/tokens/:tokenId/revoke
   * Revokes an API token
   * @param {string} tokenId - Token ID to revoke
   */
  app.put('/api/tokens/:tokenId/revoke', revokeToken);
}
