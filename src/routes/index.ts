import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './auth.routes';

export const setupRoutes = (app: Express, prisma: PrismaClient) => {
  // API health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
  });

  // Auth routes
  app.use('/api/auth', authRoutes);

  // Add other routes here
};
