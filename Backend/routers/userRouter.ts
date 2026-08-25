import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

router.get('/profile', UserController.getProfile);
router.post('/profile', UserController.updateProfile);
router.put('/profile', UserController.updateProfile);
router.patch('/profile/:id', UserController.updateProfile);
router.put('/profile/:id', UserController.updateProfile);

export const userRouter = router;

