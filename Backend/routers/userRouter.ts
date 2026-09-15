import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

// Dynamic Authentication routes with fixed dev OTP 261125
router.post('/auth/send-otp', UserController.sendOtp);
router.post('/auth/verify-otp', UserController.verifyOtp);

// User Profile CRUD
router.get('/profile', UserController.getProfile);
router.get('/profile/:phone', UserController.getProfile);
router.post('/profile', UserController.updateProfile);
router.put('/profile', UserController.updateProfile);
router.patch('/profile/:id', UserController.updateProfile);
router.put('/profile/:id', UserController.updateProfile);

export const userRouter = router;
