import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken, requireAuth } from '../middleware/auth';

const router = Router();

// Dynamic Authentication routes with fixed dev OTP 261125
router.post('/auth/send-otp', UserController.sendOtp);
router.post('/auth/verify-otp', UserController.verifyOtp);

// Authenticated current session user route
router.get('/me', requireAuth, UserController.getCurrentUser);

// User Profile CRUD
router.get('/profile', authenticateToken, UserController.getProfile);
router.get('/profile/:phone', authenticateToken, UserController.getProfile);
router.post('/profile', authenticateToken, UserController.updateProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);
router.patch('/profile/:id', authenticateToken, UserController.updateProfile);
router.put('/profile/:id', authenticateToken, UserController.updateProfile);

export const userRouter = router;
