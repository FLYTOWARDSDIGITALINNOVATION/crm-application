import express from 'express';
import { registerUser, loginUser, resetPassword, logoutUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logoutUser);

export default router;
