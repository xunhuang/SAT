import express from 'express';
import testController from '../controllers/testController';

const router = express.Router();

// Test routes (no authentication required)
router.post('/generate', testController.generateTest);

export default router;