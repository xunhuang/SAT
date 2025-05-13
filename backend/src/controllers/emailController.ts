import { Request, Response, NextFunction } from 'express';
import emailService from '../services/emailService';
import userSettingsService from '../services/userSettingsService';

/**
 * Email Controller
 * Handles HTTP requests related to email notifications
 */
export default {
  /**
   * Send test attempt completion email
   * @route POST /api/email/test-attempt
   */
  async sendTestAttemptEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        userId,
        attemptId,
        testId,
        testName,
        score,
        totalQuestions,
        timeTaken
      } = req.body;
      
      // Input validation
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      
      if (!attemptId) {
        return res.status(400).json({ error: 'Attempt ID is required' });
      }
      
      if (!testId) {
        return res.status(400).json({ error: 'Test ID is required' });
      }
      
      if (!testName) {
        return res.status(400).json({ error: 'Test name is required' });
      }
      
      if (score === undefined || totalQuestions === undefined) {
        return res.status(400).json({ error: 'Score and totalQuestions are required' });
      }
      
      if (timeTaken === undefined) {
        return res.status(400).json({ error: 'Time taken is required' });
      }
      
      // Get user's email and notification preferences
      const userEmailInfo = await userSettingsService.getUserEmailInfo(userId);
      
      if (!userEmailInfo.email) {
        return res.status(400).json({ 
          error: 'User email not found', 
          message: 'No email is available for this user. Email notification was not sent.'
        });
      }
      
      // Send email notification
      const emailSent = await emailService.sendTestAttemptEmail(
        attemptId,
        testId,
        testName,
        score,
        totalQuestions,
        timeTaken,
        userEmailInfo.email,
        userEmailInfo.notificationEmails
      );
      
      if (emailSent) {
        res.status(200).json({
          success: true,
          message: 'Test attempt email sent successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test attempt email'
        });
      }
    } catch (error) {
      console.error('Error in sendTestAttemptEmail controller:', error);
      next(error);
    }
  }
};