import { Request, Response, NextFunction } from 'express';
import questionService from '../services/questionService';

/**
 * Question Controller
 * Handles HTTP requests related to SAT questions
 */
export default {
  /**
   * Get all questions with pagination
   * @route GET /api/questions
   */
  async getQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await questionService.getQuestions(page, limit);

      res.status(200).json({
        data: {
          questions: result.questions,
          total: result.total,
          page,
          limit,
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a specific question by ID
   * @route GET /api/questions/:id
   */
  async getQuestionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const question = await questionService.getQuestionById(id);

      res.status(200).json({
        data: question
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a random question
   * @route GET /api/questions/random
   */
  async getRandomQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const question = await questionService.getRandomQuestion();

      res.status(200).json({
        data: question
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all question IDs
   * @route GET /api/questions/ids
   */
  async getAllQuestionIds(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = await questionService.getAllQuestionIds();

      res.status(200).json({
        data: ids
      });
    } catch (error) {
      next(error);
    }
  }
}