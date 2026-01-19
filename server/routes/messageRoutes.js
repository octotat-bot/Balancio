import express from 'express';
import { getGroupMessages } from '../controllers/messageController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.use(auth);

router.get('/group/:groupId', getGroupMessages);

export default router;
