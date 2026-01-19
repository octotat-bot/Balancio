import express from 'express';
import { signup, login, getMe, updateProfile, changePassword, deleteAccount } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/password', auth, changePassword);
router.delete('/account', auth, deleteAccount);

export default router;
