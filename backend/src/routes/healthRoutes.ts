import express from 'express';
import healthController from '../controllers/healthController';

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', healthController.getHealthStatus);

/**
 * @route   GET /api/health/ready
 * @desc    Readiness check endpoint
 * @access  Public
 */
router.get('/ready', healthController.getReadiness);

export default router;