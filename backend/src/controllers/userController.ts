import { Request, Response, NextFunction } from 'express';
import userSettingsService from '../services/userSettingsService';
import questionBankService from '../services/questionBankService';

/**
 * User Controller
 * Handles HTTP requests related to user management and initialization
 */
export default {
  /**
   * Check if a user is new
   * @route GET /api/users/:userId/is-new
   */
  async isNewUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      const isNew = await userSettingsService.isNewUser(userId);
      
      res.status(200).json({
        data: { isNew }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Initialize a new user (setup settings and populate question bank)
   * @route POST /api/users/initialize
   */
  async initializeUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      console.log(`Starting initialization for user: ${userId}`);
      
      // Initialize user settings
      const isNew = await userSettingsService.isNewUser(userId);
      let settings;
      
      if (isNew) {
        console.log(`User ${userId} is new, initializing settings`);
        settings = await userSettingsService.initializeNewUser(userId);
        
        // Populate question bank for new users
        console.log(`Populating question bank for new user: ${userId}`);
        const questionCount = await questionBankService.populateQuestionBank(userId);
        
        res.status(200).json({
          success: true,
          data: {
            message: `Successfully initialized new user and added ${questionCount} questions to bank`,
            isNew: true,
            settings,
            questionCount
          }
        });
      } else {
        console.log(`User ${userId} already exists, returning existing settings`);
        settings = await userSettingsService.getUserSettings(userId);
        
        res.status(200).json({
          success: true,
          data: {
            message: 'User already initialized',
            isNew: false,
            settings
          }
        });
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      next(error);
    }
  }
};