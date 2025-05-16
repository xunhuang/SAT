import { Request, Response, NextFunction } from 'express';
import emailService from '../services/emailService';
import userSettingsService from '../services/userSettingsService';
import imageConversionService from '../services/imageConversionService';

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
        timeTaken,
        wrongAnswers
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
      
      // Process wrongAnswers to convert SVG to PNG if needed
      let allAttachments: any[] = [];
      if (wrongAnswers && wrongAnswers.length > 0) {
        // Process each question's stimulus if it contains SVG
        for (let i = 0; i < wrongAnswers.length; i++) {
          if (wrongAnswers[i].stimulus && wrongAnswers[i].stimulus.includes('<svg')) {
            try {
              // Convert SVG in stimulus to PNG
              const { html, attachments } = await imageConversionService.processSvgInHtml(wrongAnswers[i].stimulus);
              wrongAnswers[i].stimulus = html;
              allAttachments = [...allAttachments, ...attachments];
            } catch (conversionError) {
              console.error('Error converting SVG to PNG:', conversionError);
              // If conversion fails, provide a fallback message
              wrongAnswers[i].stimulus = `<div style="padding: 10px; border: 1px solid #ccc; background-color: #f9f9f9; margin: 10px 0;">
                <p><strong>[Image]</strong> A graphical element is available in the online version.</p>
              </div>`;
            }
          }
        }
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
        userEmailInfo.notificationEmails,
        wrongAnswers || [],
        allAttachments
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