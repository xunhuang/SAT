import { Request, Response, NextFunction } from 'express';
import testService from '../services/testService';

/**
 * Test Controller
 * Handles HTTP requests related to test generation and management
 */
export default {
  /**
   * Generate a new test
   * @route POST /api/tests/generate
   */
  async generateTest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, testName, numQuestions } = req.body;
      
      // Input validation
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      if (!testName) {
        return res.status(400).json({ error: 'Test name is required' });
      }
      
      // Default to 10 questions if not specified
      const questionsCount = numQuestions ? parseInt(numQuestions.toString()) : 10;
      
      if (isNaN(questionsCount) || questionsCount <= 0) {
        return res.status(400).json({ error: 'Number of questions must be a positive integer' });
      }
      
      // Generate test
      const testId = await testService.generateTest(userId, testName, questionsCount);
      
      res.status(201).json({
        success: true,
        data: {
          testId,
          message: 'Test generated successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
}