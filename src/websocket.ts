import WebSocket from "ws";
import { PrismaClient } from "@prisma/client";

/**
 * Information about a connected client
 * @interface ClientInfo
 */
interface ClientInfo {
  /** Unique identifier for the user */
  userId: string;
  /** Identifier for the room the user is in */
  roomId: string;
}

/**
 * Data structure for joining a room
 * @interface JoinRoomData
 */
interface JoinRoomData {
  /** Unique identifier for the user */
  userId: string;
  /** Identifier for the room to join */
  roomId: string;
  /** Message type identifier */
  type: "join";
}

/**
 * Data structure for sending a message
 * @interface MessageData
 */
interface MessageData {
  /** Content of the message */
  content: string;
  /** Unique identifier for the sender */
  userId: string;
  /** Identifier for the target room */
  roomId: string;
  /** Message type identifier */
  type: "message";
}

/** Union type for all WebSocket data types */
type WebSocketData = JoinRoomData | MessageData;

/** Map to store active connections and their room subscriptions */
export const clients = new Map<WebSocket, ClientInfo>();

/**
 * Handles a user joining a chat room
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {JoinRoomData} data - Data containing user and room information
 * @param {PrismaClient} prisma - Prisma client for database operations
 * @returns {Promise<void>}
 */
export async function handleJoinRoom(
  ws: WebSocket,
  data: JoinRoomData,
  prisma: PrismaClient
): Promise<void> {
  const { userId, roomId } = data;

  // Store client connection with room info
  clients.set(ws, { userId, roomId });

  // Send confirmation to the client
  ws.send(
    JSON.stringify({
      type: "join_confirmation",
      roomId,
    })
  );

  // Fetch and send previous messages
  await sendPreviousMessages(ws, roomId, prisma);
}

/**
 * Fetches and sends previous messages from a room to a client
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {string} roomId - Identifier for the room
 * @param {PrismaClient} prisma - Prisma client for database operations
 * @returns {Promise<void>}
 */
async function sendPreviousMessages(
  ws: WebSocket,
  roomId: string,
  prisma: PrismaClient
): Promise<void> {
  try {
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 50, // Limit to last 50 messages
    });

    ws.send(
      JSON.stringify({
        type: "previous_messages",
        messages,
      })
    );
  } catch (error) {
    console.error("Error fetching previous messages:", error);
  }
}

/**
 * Handles a new message from a client
 *
 * @param {WebSocket} ws - The WebSocket connection
 * @param {MessageData} data - Data containing the message content and metadata
 * @param {PrismaClient} prisma - Prisma client for database operations
 * @returns {Promise<void>}
 */
export async function handleNewMessage(
  ws: WebSocket,
  data: MessageData,
  prisma: PrismaClient
): Promise<void> {
  const { content, userId, roomId } = data;
  const clientInfo = clients.get(ws);

  if (!clientInfo) {
    return;
  }

  try {
    // Save message to database
    const message = await prisma.message.create({
      data: {
        content,
        userId,
        roomId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Broadcast message to all clients in the same room
    broadcastToRoom(roomId, {
      type: "new_message",
      message,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Failed to save message",
      })
    );
  }
}

/**
 * Broadcasts a message to all clients in a specific room
 *
 * @param {string} roomId - Identifier for the target room
 * @param {any} data - The data to broadcast
 * @returns {void}
 */
export function broadcastToRoom(roomId: string, data: any): void {
  const message = JSON.stringify(data);

  clients.forEach((clientInfo, client) => {
    if (clientInfo.roomId === roomId && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
