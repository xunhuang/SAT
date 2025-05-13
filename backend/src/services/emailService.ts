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
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

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
        subject: `New SAT Practice Test: ${testName}`,
        text: `
Hello,

A new SAT practice test "${testName}" has been created for you.

You can take the test at: ${testUrl}

Good luck!

The SAT Practice Team
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2c6ecf;">New SAT Practice Test</h2>
  <p>A new SAT practice test has been created for you:</p>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">${testName}</h3>
    <p>This test is now ready for you to take.</p>
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
};