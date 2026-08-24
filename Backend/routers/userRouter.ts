import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

router.get('/profile', UserController.getProfile);
router.patch('/profile/:id', UserController.updateProfile);

export const userRouter = router;
