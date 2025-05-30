import { Router } from 'express';
import { createUser } from '../controllers/users.controller';
import { authenticateClientToken } from '../middleware/apiAuth';

const router = Router();

// Client token protected routes
router.post('/', authenticateClientToken, createUser);

export default router;
