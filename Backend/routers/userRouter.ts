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

// User Orders, Cart, & Delivery Sites DB Persistence
router.get('/orders', authenticateToken, UserController.getUserOrders);
router.get('/cart', authenticateToken, UserController.getUserCart);
router.post('/cart', authenticateToken, UserController.updateUserCart);
router.put('/cart', authenticateToken, UserController.updateUserCart);
router.get('/addresses', authenticateToken, UserController.getUserAddresses);
router.post('/addresses', authenticateToken, UserController.addAddress);

export const userRouter = router;
