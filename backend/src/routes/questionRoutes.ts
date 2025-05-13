import express from 'express';
import questionController from '../controllers/questionController';

const router = express.Router();

// All routes are now public (no authentication required)
router.get('/', questionController.getQuestions);
router.get('/ids', questionController.getAllQuestionIds);

// Note: The order is important - specific routes should come before parameterized routes
router.get('/random', questionController.getRandomQuestion);
router.get('/:id', questionController.getQuestionById);

export default router;