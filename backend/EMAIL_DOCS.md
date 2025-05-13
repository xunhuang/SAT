# Email Notification API

This document describes the email notification endpoints for the SAT Practice application.

## Base URL

In development: `http://localhost:4000/api/email`

## Endpoints

### Send Test Attempt Email

```
POST /test-attempt
```

Sends an email notification when a test attempt is completed, including test score, time taken, and links to review or retake the test.

**Request Body:**
```json
{
  "userId": "string",
  "attemptId": "string",
  "testId": "string",
  "testName": "string",
  "score": 8,
  "totalQuestions": 10,
  "timeTaken": 300
}
```

**Parameters:**
- `userId` (required): The user ID of the test taker
- `attemptId` (required): The ID of the completed test attempt
- `testId` (required): The ID of the test that was taken
- `testName` (required): The name of the test
- `score` (required): The number of correct answers
- `totalQuestions` (required): The total number of questions in the test
- `timeTaken` (required): The time taken to complete the test in seconds

**Response:**
```json
{
  "success": true,
  "message": "Test attempt email sent successfully"
}
```

## Error Handling

The endpoint returns standardized error responses:

```json
{
  "error": "Error message description",
  "message": "Additional information if available"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad request or validation error
- 500: Server error

## Integration Example

To integrate test attempt email notifications in the frontend:

```typescript
// Sample integration code (for frontend)
async function sendTestAttemptEmail(
  userId: string,
  attemptId: string,
  testId: string,
  testName: string,
  score: number,
  totalQuestions: number,
  timeTaken: number
): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:4000/api/email/test-attempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        attemptId,
        testId,
        testName,
        score,
        totalQuestions,
        timeTaken
      }),
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error sending test attempt email:', error);
    return false;
  }
}

// Example usage after test completion
// This should be called after saving the test attempt to Firestore
function onTestSubmit() {
  // Save test attempt to Firestore first
  const attemptId = await saveTestAttempt(/* ... */);
  
  // Then send email notification
  const emailSent = await sendTestAttemptEmail(
    userId,
    attemptId,
    testId,
    testName,
    score,
    totalQuestions,
    timeTaken
  );
  
  if (emailSent) {
    console.log('Test attempt email notification sent successfully');
  }
}
```

## Email Template

The email sent to users will include:
- Test name
- Score (as both number and percentage)
- Time taken to complete the test
- Link to review answers
- Link to retake the test

The email is formatted with a professional design that is optimized for both desktop and mobile email clients.