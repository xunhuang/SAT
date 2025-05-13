# SAT Practice Backend Changes

## Test Generation API Implementation

### Background
Previously, the test generation was implemented directly in the frontend. The frontend would:
1. Call the backend to fetch random questions
2. Create a test object in the React state
3. Save the test to Firestore directly from the client

This approach had several drawbacks:
- Increased network traffic between frontend and backend
- Business logic distributed across frontend and backend
- Firebase rules needed to be more permissive
- Potential for data inconsistency

### New Implementation
The new implementation moves test generation to the backend:

1. Frontend makes a single API call with `userId`, `testName`, and `numQuestions`
2. Backend generates the test with random questions
3. Backend saves the test directly to Firestore
4. Backend returns just the `testId` to the frontend
5. Frontend fetches the updated tests list to display the new test

### Benefits
- Reduced network traffic (single API call instead of multiple)
- Centralized business logic in the backend
- Better security with backend-managed Firestore operations
- More consistent data and simplified frontend code

## Files Changed

### Backend
- Added `testService.ts`: Handles test generation and Firebase persistence
- Added `testController.ts`: Handles HTTP requests for test operations
- Added `testRoutes.ts`: Defines API routes for test operations
- Updated `routes/index.ts`: Added test routes to API

### Frontend
- Updated `api.ts`: Added generateTest method to call the new backend endpoint
- Updated `TestList.tsx`: Modified test creation to use the new API call

## API Documentation

The new API endpoint:

```
POST /api/tests/generate
```

Request body:
```json
{
  "userId": "string",
  "testName": "string",
  "numQuestions": 10
}
```

Response:
```json
{
  "success": true,
  "data": {
    "testId": "string",
    "message": "Test generated successfully"
  }
}
```

## Usage

1. From the frontend, call the generateTest API with:
   - The user's ID
   - The desired test name
   - Number of questions (optional, defaults to 10)

2. On successful response, fetch the user's tests to display the new test

## Error Handling

The API performs validation on:
- Required userId and testName
- Valid numQuestions value

Appropriate error messages are returned if validation fails.

## Future Improvements

- Add authentication middleware to protect test generation
- Add more test customization options (question types, difficulty, etc.)
- Implement test template functionality