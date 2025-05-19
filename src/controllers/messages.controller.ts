import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import tryCatch from '../utils/tryCatch';
import { ApiAuthRequest } from '../middleware/apiAuth';
import { JwtAPIPayloadType } from '../utils/jwt';
import { broadcastToRoom } from '../websocket';

const prisma = new PrismaClient();

/**
 * Get messages for a specific user
 */
export const getUserMessages = tryCatch(async (req: ApiAuthRequest, res: Response) => {
  const { apiUser } = req;
  
  if (!apiUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // Get all messages sent by the user
  const messages = await prisma.message.findMany({
    where: { userId: apiUser.userId },
    include: {
      room: true,
      user: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return res.json(messages);
});

/**
 * Get messages for a specific room
 */
export const getRoomMessages = tryCatch(async (req: ApiAuthRequest, res: Response) => {
  const { roomId } = req.params;
  const { apiUser } = req;
  
  if (!apiUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // For client tokens, return all messages
  // For user tokens, check if the user is a member of the room first
  if (apiUser.type !== JwtAPIPayloadType.CLIENT) {
    const userInRoom = await prisma.room.findFirst({
      where: {
        id: roomId,
        users: {
          some: {
            id: apiUser.userId
          }
        }
      }
    });
    
    if (!userInRoom) {
      return res.status(403).json({ error: "You don't have access to this room" });
    }
  }
  
  const messages = await prisma.message.findMany({
    where: { roomId },
    include: {
      user: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  return res.json(messages);
});

/**
 * Send a new message to a room
 */
export const sendMessage = tryCatch(async (req: ApiAuthRequest, res: Response) => {
  const { roomId } = req.params;
  const { content } = req.body;
  const { apiUser } = req;
  
  if (!apiUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (!content) {
    return res.status(400).json({ error: "Message content is required" });
  }
  
  // For client tokens, allow sending to any room
  // For user tokens, check if the user is a member of the room first
  if (apiUser.type !== JwtAPIPayloadType.CLIENT) {
    const userInRoom = await prisma.room.findFirst({
      where: {
        id: roomId,
        users: {
          some: {
            id: apiUser.userId
          }
        }
      }
    });
    
    if (!userInRoom) {
      return res.status(403).json({ error: "You don't have access to this room" });
    }
  }
  
  // Create the message
  const message = await prisma.message.create({
    data: {
      content,
      userId: apiUser.userId,
      roomId
    },
    include: {
      user: {
        select: {
          id: true,
          username: true
        }
      }
    }
  });
  
  // Broadcast the message to all users in the room
  broadcastToRoom(roomId, {
    type: 'new_message',
    message
  });
  
  return res.status(201).json(message);
});

/**
 * Get all messages (admin/client only)
 */
export const getAllMessages = tryCatch(async (req: ApiAuthRequest, res: Response) => {
  const { apiUser } = req;
  
  if (!apiUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // Only allow client tokens or admin users to get all messages
  if (apiUser.type !== JwtAPIPayloadType.CLIENT) {
    return res.status(403).json({ error: "Only client tokens can access all messages" });
  }
  
  const messages = await prisma.message.findMany({
    include: {
      room: true,
      user: {
        select: {
          id: true,
          username: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  return res.json(messages);
});
