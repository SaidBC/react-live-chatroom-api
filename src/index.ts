import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { setupRoutes } from './routes';
import { 
  handleJoinRoom, 
  handleNewMessage, 
  broadcastToRoom, 
  clients 
} from './websocket';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Setup API routes
setupRoutes(app, prisma);

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  
  ws.on('message', async (message: WebSocket.Data) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'join':
          // Handle room joining
          handleJoinRoom(ws, data, prisma);
          break;
        case 'message':
          // Handle new message
          await handleNewMessage(ws, data, prisma);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove client from the clients map
    clients.delete(ws);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Export for testing
export { app, server, prisma };
