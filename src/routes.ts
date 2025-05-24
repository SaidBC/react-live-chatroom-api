import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateApiToken } from './middleware/apiAuth';
import { generateUserToken, generateClientToken, revokeToken } from './controllers/tokens.controller';
import { sendMessage, getRoomMessages, getUserMessages, getAllMessages } from './controllers/messages.controller';
import { getAllUsers, createUser } from './controllers/users.controller';
import { getAllRooms, createRoom, getRoomById, addUserToRoom } from './controllers/rooms.controller';

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
  app.get('/api/rooms', authenticateApiToken, getAllRooms);

  /**
   * POST /api/rooms
   * Creates a new chat room and associates it with the specified user
   * @requires {name} - Name of the room to create
   * @requires {userId} - ID of the user creating the room
   */
  app.post('/api/rooms', createRoom);

  /**
   * GET /api/rooms/:id
   * Retrieves a specific room by ID, including its associated users
   * @param {string} id - Room ID
   */
  app.get('/api/rooms/:id', getRoomById);

  /**
   * GET /api/users
   * Retrieves all users from the database
   */
  app.get('/api/users', getAllUsers);

  /**
   * POST /api/users
   * Creates a new user
   * @requires {username} - Username for the new user
   */
  app.post('/api/users', createUser);

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
  app.post('/api/rooms/:roomId/users', addUserToRoom);
  
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
