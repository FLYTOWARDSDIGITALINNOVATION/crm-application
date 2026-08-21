import express from 'express';
import { subscribe } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/subscribe', protect, subscribe);

export default router;
