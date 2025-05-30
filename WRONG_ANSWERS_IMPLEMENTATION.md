# Wrong Answers in Test Attempt Emails

This document explains the implementation of including wrong answers in email notifications for test attempts.

## Overview

When a user completes a test, they now receive an email that includes detailed information about the questions they answered incorrectly. This helps users learn from their mistakes and understand the correct answers without having to log back into the application.

## Implementation Details

### 1. Data Structure

Added a `WrongAnswer` interface to represent questions answered incorrectly:

```typescript
export interface WrongAnswer {
  question: string;      // Question text (stem)
  stimulus?: string;     // Optional stimulus text
  options: Array<{       // All answer options
    id: string;
    content: string;
  }>;
  userAnswer: string;    // ID of the option selected by the user
  correctAnswer: string; // ID of the correct option
  explanation: string;   // Explanation for the correct answer
}
```

### 2. Backend Changes

#### Email Service

- Updated `sendTestAttemptEmail` function to accept a new parameter `wrongAnswers`
- Added HTML and text formatting for wrong answers in the email template
- Enhanced the email with color coding for correct and incorrect answers

#### Email Controller

- Updated to accept and pass the `wrongAnswers` array from request body to email service

### 3. Frontend Changes

#### API Service

- Updated `sendTestAttemptEmail` function to accept and send wrong answers
- Added the `WrongAnswer` interface to be used across the application

#### User Settings Service

- Updated `sendTestAttemptNotifications` to pass wrong answers to the API service

#### Test View Component

- Enhanced `calculateScore` to collect wrong answers while calculating the score
- Modified the submit flow to include wrong answers in email notifications

## Email Design

The wrong answers section in the email:

1. Has a clear heading "Questions You Missed"
2. Lists each question with:
   - The question text (stem)
   - The stimulus text (if available)
   - All answer options labeled as A, B, C, D, etc.
   - Color-coded highlighting:
     - User's answer (highlighted in red)
     - Correct answer (highlighted in green)
   - The explanation provided for the correct answer

## SVG to PNG Conversion

Many SAT questions include SVG graphs or diagrams that cannot be directly rendered in email clients. To address this:

1. Frontend: Send raw SVG content to the backend
   - The frontend collects the original stimulus content including SVG tags
   - This raw content is included in the wrongAnswers array sent to the backend

2. Backend: Process SVG content using `imageConversionService`
   - SVG content is extracted from the HTML using regex
   - Each SVG is converted to a PNG image using pure Node.js libraries (svg2img and sharp)
   - The PNG is encoded as a base64 data URL
   - The original SVG tag is replaced with an <img> tag containing the PNG data

3. Email Rendering:
   - HTML emails display the actual graphs/diagrams as PNG images
   - Plain text emails include a note to view the HTML version

This approach ensures that users can see the actual visual content within their email client rather than just reading a description, providing a much better experience.

## Benefits

- Users get immediate feedback on their mistakes
- Learning is reinforced by seeing explanations of correct answers
- Users can review without having to log back into the application
- Visual design makes it easy to identify correct and incorrect answers

## Testing

To test this functionality:
1. Take a test and deliberately answer some questions incorrectly
2. Submit the test
3. Check the email received to verify it contains:
   - The questions you answered incorrectly
   - Your selected answers highlighted in red
   - The correct answers highlighted in green
   - Explanations for each wrong answer