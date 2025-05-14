import express from 'express';
import userController from '../controllers/userController';

const router = express.Router();

// Check if user is new
router.get('/:userId/is-new', userController.isNewUser);

// Initialize user (settings and question bank)
router.post('/initialize', userController.initializeUser);

export default router;