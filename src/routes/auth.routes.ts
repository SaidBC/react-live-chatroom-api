import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
