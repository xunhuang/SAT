import express from 'express';
import healthRoutes from './healthRoutes';
import questionRoutes from './questionRoutes';
import testRoutes from './testRoutes';
// Import other route files here as the application grows

const router = express.Router();

// Health routes
router.use('/health', healthRoutes);

// Question routes
router.use('/questions', questionRoutes);

// Test routes
router.use('/tests', testRoutes);

// Add other routes here
// router.use('/auth', authRoutes);

export default router;