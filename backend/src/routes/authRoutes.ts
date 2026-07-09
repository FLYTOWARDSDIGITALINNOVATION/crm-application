import express from 'express';
import { registerUser, loginUser, resetPassword } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);

export default router;
