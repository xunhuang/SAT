import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'sat-practice@example.com';
const BASE_URL = process.env.BASE_URL || 'https://sattest-eaadc.firebaseapp.com';

// Create a nodemailer transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Check if email service is properly configured
const isEmailConfigured = (): boolean => {
  return Boolean(EMAIL_USER && EMAIL_PASS);
};

interface Option {
  id: string;
  content: string;
}

interface WrongAnswer {
  question: string;
  stimulus?: string;
  options: Option[];
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

/**
 * Email Service
 * Provides functionality for sending emails in the application
 */
export default {
  /**
   * Send test notification email
   * @param testId Test ID
   * @param testName Test name
   * @param recipientEmail Primary recipient email
   * @param additionalEmails Additional notification emails (optional)
   * @returns Promise<boolean> Success status
   */
  async sendTestNotification(
    testId: string,
    testName: string,
    numQuestions: number,
    userName: string,
    recipientEmail: string,
    additionalEmails: string[] = []
  ): Promise<boolean> {
    try {
      if (!isEmailConfigured()) {
        console.warn('Email service not properly configured. Skipping notification.');
        return false;
      }

      // Create a list of all recipients (removing duplicates)
      const allRecipients = Array.from(
        new Set([recipientEmail, ...additionalEmails].filter(Boolean))
      );

      if (allRecipients.length === 0) {
        console.warn('No valid email recipients. Skipping notification.');
        return false;
      }

      // Test URL for accessing the test
      const testUrl = `${BASE_URL}/test/${testId}`;

      // Email content
      const mailOptions = {
        from: `"SAT Practice" <${EMAIL_FROM}>`,
        to: allRecipients.join(', '),
        subject: `New SAT Practice Test (${numQuestions} Questions): ${testName}`,
        text: `
Hello,

${userName} created a new SAT practice test "${testName}" with ${numQuestions} questions.

You can take the test at: ${testUrl}

Good luck!

The SAT Practice Team
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2c6ecf;">New SAT Practice Test</h2>
  <p>${userName} created a new SAT practice test for you:</p>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">${testName}</h3>
    <p>This test contains <strong>${numQuestions} questions</strong> and is ready for you to take.</p>
  </div>
  <p>
    <a href="${testUrl}" style="display: inline-block; background-color: #2c6ecf; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      Start Test
    </a>
  </p>
  <p style="color: #666; margin-top: 30px; font-size: 14px;">
    Good luck with your practice!<br>
    The SAT Practice Team
  </p>
</div>
        `,
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Test notification email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending test notification email:', error);
      return false;
    }
  },

  /**
   * Send test attempt completion email
   * @param attemptId Test attempt ID
   * @param testId Test ID
   * @param testName Test name
   * @param score Score achieved
   * @param totalQuestions Total number of questions
   * @param timeTaken Time taken in seconds
   * @param recipientEmail Primary recipient email
   * @param additionalEmails Additional notification emails (optional)
   * @param wrongAnswers Details of wrong answers (optional)
   * @param attachments Attachments for the email
   * @returns Promise<boolean> Success status
   */
  async sendTestAttemptEmail(
    attemptId: string,
    testId: string,
    testName: string,
    score: number,
    totalQuestions: number,
    allocatedTime: number,
    timeTaken: number,
    userName: string,
    recipientEmail: string,
    additionalEmails: string[] = [],
    wrongAnswers: WrongAnswer[] = [],
    attachments: any[] = []
  ): Promise<boolean> {
    try {
      if (!isEmailConfigured()) {
        console.warn('Email service not properly configured. Skipping notification.');
        return false;
      }

      // Create a list of all recipients (removing duplicates)
      const allRecipients = Array.from(
        new Set([recipientEmail, ...additionalEmails].filter(Boolean))
      );

      if (allRecipients.length === 0) {
        console.warn('No valid email recipients. Skipping notification.');
        return false;
      }

      // Format times
      const format = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
      const timeFormatted = format(timeTaken);
      const allocatedFormatted = format(allocatedTime);

      // Calculate percentage score
      const percentage = Math.round((score / totalQuestions) * 100);

      // URLs for review and retake
      const reviewUrl = `${BASE_URL}/review/${attemptId}`;
      const retakeUrl = `${BASE_URL}/retake/${attemptId}`;
      
      // Generate HTML for wrong answers section
      let wrongAnswersHtml = '';
      let wrongAnswersText = '';
      
      if (wrongAnswers && wrongAnswers.length > 0) {

        wrongAnswersHtml = `
        <div style="margin-top: 30px;">
          <h3 style="color: #2c6ecf; border-bottom: 1px solid #eee; padding-bottom: 10px;">Questions You Missed</h3>
          
          ${wrongAnswers.map((item, index) => `
            <div style="margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
              <p style="font-weight: bold; margin-bottom: 10px;">Question ${index + 1}:</p>
              <div style="margin-bottom: 15px;">${item.question}</div>
              
              ${item.stimulus ? `<div style="margin-bottom: 15px;">${item.stimulus}</div>` : ''}
              
              <div style="margin-bottom: 10px;">
                ${item.options.map((option: Option, optionIndex: number) => `
                  <div style="
                    margin-bottom: 5px; 
                    padding: 8px; 
                    background-color: ${option.id === item.correctAnswer ? '#e8f5e9' : option.id === item.userAnswer ? '#ffebee' : '#f5f5f5'}; 
                    border-left: 3px solid ${option.id === item.correctAnswer ? '#4caf50' : option.id === item.userAnswer ? '#f44336' : '#ddd'};
                  ">
                    <strong>${String.fromCharCode(65 + optionIndex)}.</strong> ${option.content}
                    ${option.id === item.correctAnswer ? ' <span style="color: #4caf50; font-weight: bold;">(Correct Answer)</span>' : ''}
                    ${option.id === item.userAnswer ? ' <span style="color: #f44336; font-weight: bold;">(Your Answer)</span>' : ''}
                  </div>
                `).join('')}
              </div>
              
              <div style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #2c6ecf; margin-top: 10px;">
                <p style="font-weight: bold; margin-bottom: 5px; color: #2c6ecf;">Explanation:</p>
                <div>${item.explanation || 'No explanation available.'}</div>
              </div>
            </div>
          `).join('')}
        </div>
        `;
        
        wrongAnswersText = '\n\nQuestions You Missed:\n\n' + 
          wrongAnswers.map((item, index) => 
            `Question ${index + 1}: ${item.question}\n` + 
            `${item.stimulus ? 'Stimulus: [See email HTML version or review answers online for complete graphs and images]\n' : ''}` +
            `${item.options.map((opt: Option, i: number) => `${String.fromCharCode(65 + i)}. ${opt.content}${opt.id === item.userAnswer ? ' (Your Answer)' : ''}${opt.id === item.correctAnswer ? ' (Correct Answer)' : ''}`).join('\n')}\n` + 
            `Explanation: ${item.explanation || 'No explanation available.'}\n`
          ).join('\n');
      }

      // Email content
      const mailOptions = {
        from: `"SAT Practice" <${EMAIL_FROM}>`,
        to: allRecipients.join(', '),
        subject: `SAT Practice Results: ${testName} - ${score}/${totalQuestions} (${percentage}%)`,
        text: `
Hello,

${userName} completed the SAT practice test "${testName}".

Test Results:
- Score: ${score}/${totalQuestions} (${percentage}%)
- Time Taken: ${timeFormatted}
- Time Allocated: ${allocatedFormatted}

You can review your answers here: ${reviewUrl}
Want to try again? Retake the test: ${retakeUrl}
${wrongAnswersText}
Keep practicing!

The SAT Practice Team
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2c6ecf;">Test Results</h2>
  <p>${userName} completed the SAT practice test:</p>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">${testName}</h3>
    <div style="display: flex; justify-content: space-between; margin-top: 15px;">
      <div style="text-align: center; padding: 10px 15px; background-color: white; border-radius: 5px; flex: 1; margin-right: 10px;">
        <div style="font-size: 14px; color: #666;">Score</div>
        <div style="font-size: 24px; font-weight: bold; color: ${percentage >= 70 ? '#4caf50' : percentage >= 50 ? '#ff9800' : '#f44336'};">
          ${score}/${totalQuestions}
        </div>
        <div style="font-size: 16px;">${percentage}%</div>
      </div>
      <div style="text-align: center; padding: 10px 15px; background-color: white; border-radius: 5px; flex: 1;">
        <div style="font-size: 14px; color: #666;">Time</div>
        <div style="font-size: 24px; font-weight: bold; color: #2c6ecf;">${timeFormatted}</div>
        <div style="font-size: 14px; color: #666;">Allocated: ${allocatedFormatted}</div>
      </div>
    </div>
  </div>
  <div style="display: flex; justify-content: space-between; margin: 25px 0;">
    <a href="${reviewUrl}" style="flex: 1; text-align: center; background-color: #2c6ecf; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 10px;">
      Review Answers
    </a>
    <a href="${retakeUrl}" style="flex: 1; text-align: center; background-color: #ff9800; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      Retake Test
    </a>
  </div>
  
  ${wrongAnswersHtml}
  
  <p style="color: #666; margin-top: 30px; font-size: 14px;">
    Keep practicing to improve your score!<br>
    The SAT Practice Team
  </p>
</div>
        `,
        attachments: attachments
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Test attempt email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending test attempt email:', error);
      return false;
    }
  },
};