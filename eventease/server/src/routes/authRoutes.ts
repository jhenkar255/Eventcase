import { Router } from 'express';
import * as auth from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate, registerSchema, loginSchema, forgotPasswordSchema, profileUpdateSchema } from '../validators';

const router = Router();

router.post('/register', validate({ body: registerSchema }), auth.register);
router.post('/login', validate({ body: loginSchema }), auth.login);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), auth.forgotPassword);
router.get('/me', protect, auth.getMe);
router.put('/profile', protect, validate({ body: profileUpdateSchema }), auth.updateProfile);
router.put('/change-password', protect, auth.changePassword);

export default router;
