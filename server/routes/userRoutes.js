import express from 'express';
import { auth } from '../middleware/auth.js';
import { getAnalytics, searchUsers, updateProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/analytics', auth, getAnalytics);
router.get('/search', auth, searchUsers);
router.put('/profile', auth, updateProfile);

export default router;
