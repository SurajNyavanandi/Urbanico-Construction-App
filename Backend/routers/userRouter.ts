import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth, requireAdminSecret } from '../middleware/auth';

const router = Router();

// Dynamic Authentication routes with fixed dev OTP 261125
router.post('/auth/send-otp', UserController.sendOtp);
router.post('/auth/verify-otp', UserController.verifyOtp);
router.post('/email/send-otp', UserController.sendEmailOtp);
router.post('/email/verify-otp', UserController.verifyEmailOtp);

// Authenticated current session user route
router.get('/me', requireAuth, UserController.getCurrentUser);

// User Profile CRUD
router.delete('/', requireAdminSecret, UserController.deleteAllUsers);
router.get('/profile', requireAuth, UserController.getProfile);
router.get('/profile/:phone', requireAuth, UserController.getProfile);
router.post('/profile', requireAuth, UserController.updateProfile);
router.put('/profile', requireAuth, UserController.updateProfile);
router.patch('/profile/:id', requireAuth, UserController.updateProfile);
router.put('/profile/:id', requireAuth, UserController.updateProfile);

// User Orders, Cart, & Delivery Sites DB Persistence (strictly authenticated to prevent IDOR)
router.get('/orders', requireAuth, UserController.getUserOrders);
router.get('/cart', requireAuth, UserController.getUserCart);
router.post('/cart', requireAuth, UserController.updateUserCart);
router.put('/cart', requireAuth, UserController.updateUserCart);
router.get('/addresses', requireAuth, UserController.getUserAddresses);
router.post('/addresses', requireAuth, UserController.addAddress);

export const userRouter = router;
