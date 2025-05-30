# Email Notification Implementation

This document outlines the implementation of email notifications for test attempt completions in the SAT Practice application.

## Overview

The system now sends email notifications when a user completes a test attempt. The email includes:
- Test name
- User's score (number correct and percentage)
- Time taken to complete the test 
- Links to review the test attempt and retake the test
- Detailed breakdown of questions answered incorrectly, including:
  - Question text (stem)
  - Stimulus text (if available)
  - All answer options labeled as A, B, C, D, etc.
  - The user's selected answer (highlighted in red)
  - The correct answer (highlighted in green)
  - Explanation for each question

## Implementation Details

### Backend

The backend already had most of the required functionality implemented:

1. **Email Service** (`emailService.ts`):
   - Uses Nodemailer to send emails
   - Provides HTML templates for professional-looking emails
   - Includes test attempt completion email with score, time, and links

2. **Email Controller** (`emailController.ts`):
   - Handles the HTTP request for sending test attempt emails
   - Validates required parameters
   - Gets the user's email and notification preferences

3. **Email Routes** (`emailRoutes.ts`):
   - Exposes the `/api/email/test-attempt` endpoint

### Frontend

The frontend has been updated to integrate with this backend functionality:

1. **API Service** (`api.ts`):
   - Already included a `sendTestAttemptEmail` function that calls the backend endpoint
   - Updated to handle SVG/graphical content in questions

2. **User Settings Service** (`userSettingsService.ts`):
   - Updated `sendTestAttemptNotifications` to use the API service
   - Added proper error handling and return values

3. **Test View Component** (`TestView.tsx`):
   - Updated the `submitTest` function to:
     - Calculate time taken for the test
     - Process graphical content for email compatibility
     - Call the updated notification function with all required parameters
     - Handle success/failure of email sending

## Testing

To test this functionality:

1. Complete a test as a logged-in user
2. The system will save the test attempt to Firestore
3. The system will automatically send an email notification with the test results
4. Check the logs for confirmation of successful email sending

## Requirements

- Backend server running on port 4000
- Valid email configuration in the backend `.env` file:
  - `EMAIL_HOST`
  - `EMAIL_PORT`
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `EMAIL_FROM`
  - `BASE_URL`

## SVG to PNG Conversion for Email

Since many SAT questions include SVG graphs and diagrams that cannot be directly rendered in emails:

1. SVG content in questions is sent to the backend with the test attempt data
2. The backend processes these SVGs using a dedicated `imageConversionService`:
   - SVG content is extracted from HTML
   - Each SVG is converted to a PNG image using pure Node.js libraries (svg2img and sharp)
   - The PNG is encoded as a base64 data URL
   - The SVG in HTML is replaced with an `<img>` tag containing the PNG data URL
3. This allows graphical content to be properly displayed in HTML emails
4. For plain text emails:
   - A note directs users to view the HTML version or use the review link
   
This approach ensures users can see the actual diagrams and graphs directly in their email clients, providing a much better experience than text descriptions alone, with no dependencies on external system tools.

## Future Enhancements

- Add user interface for managing notification email preferences
- Add email templates for other events (test creation, study reminders, etc.)
- Implement unsubscribe functionality for notification emails
- Enhance handling of mathematical formulas and equations in emails