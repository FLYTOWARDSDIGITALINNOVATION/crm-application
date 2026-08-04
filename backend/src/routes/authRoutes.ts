import express from 'express';
import multer from 'multer';
import { registerUser, loginUser, resetPassword, logoutUser, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);
router.post('/logout', upload.single('screenshot'), logoutUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getCurrentUser);

export default router;
