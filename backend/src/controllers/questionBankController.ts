import { Request, Response, NextFunction } from 'express';
import questionBankService from '../services/questionBankService';

/**
 * Question Bank Controller
 * Handles HTTP requests related to user question banks
 */
export default {
  /**
   * Get count of questions in user's bank
   * @route GET /api/question-bank/count/:userId
   */
  async getBankQuestionCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const count = await questionBankService.getBankQuestionCount(userId);
      
      res.status(200).json({
        data: {
          count
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all questions from a user's bank
   * @route GET /api/question-bank/:userId
   */
  async getBankQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const questions = await questionBankService.getBankQuestions(userId);
      
      res.status(200).json({
        data: {
          questions,
          count: questions.length
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Populate a user's question bank with all available questions
   * @route POST /api/question-bank/populate
   */
  async populateQuestionBank(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      console.log(`Starting population of question bank for user: ${userId}`);
      
      // This operation might take time for large question sets
      const count = await questionBankService.populateQuestionBank(userId);
      
      res.status(200).json({
        success: true,
        data: {
          message: `Successfully added ${count} questions to bank`,
          count
        }
      });
    } catch (error) {
      console.error('Error in populateQuestionBank controller:', error);
      next(error);
    }
  },
  
  /**
   * Get random questions from a user's bank
   * @route GET /api/question-bank/:userId/random/:count
   */
  async getRandomQuestionsFromBank(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, count } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const questionCount = count ? parseInt(count) : 10;
      
      if (isNaN(questionCount) || questionCount <= 0) {
        return res.status(400).json({ error: 'Count must be a positive integer' });
      }
      
      const questions = await questionBankService.getRandomQuestionsFromBank(userId, questionCount);
      
      res.status(200).json({
        data: {
          questions,
          count: questions.length
        }
      });
    } catch (error) {
      next(error);
    }
  }
}