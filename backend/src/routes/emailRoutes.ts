import express from 'express';
import emailController from '../controllers/emailController';

const router = express.Router();

// Route for sending test attempt completion emails
router.post('/test-attempt', emailController.sendTestAttemptEmail);

export default router;