import express from 'express';
import healthRoutes from './healthRoutes';
import questionRoutes from './questionRoutes';
import testRoutes from './testRoutes';
import questionBankRoutes from './questionBankRoutes';
import emailRoutes from './emailRoutes';
// Import other route files here as the application grows

const router = express.Router();

// Health routes
router.use('/health', healthRoutes);

// Question routes
router.use('/questions', questionRoutes);

// Test routes
router.use('/tests', testRoutes);

// Question Bank routes
router.use('/question-bank', questionBankRoutes);

// Email routes
router.use('/email', emailRoutes);

// Add other routes here
// router.use('/auth', authRoutes);

export default router;