import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';

export const setupRoutes = (app: Express, prisma: PrismaClient) => {
  // API health check
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
  });

  // Auth routes (profile only)
  app.use('/api/auth', authRoutes);
  
  // Users routes (requires client token)
  app.use('/api/users', usersRoutes);

  // Add other routes here
};
