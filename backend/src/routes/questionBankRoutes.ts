import express from 'express';
import questionBankController from '../controllers/questionBankController';

const router = express.Router();

// Get question count in bank
router.get('/count/:userId', questionBankController.getBankQuestionCount);

// Get all questions in bank
router.get('/:userId', questionBankController.getBankQuestions);

router.post('/populate', questionBankController.populateQuestionBank);

export default router;