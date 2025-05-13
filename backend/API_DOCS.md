# SAT Practice API Documentation

This document describes the available endpoints and usage of the SAT Practice API.

## Base URL

In development: `http://localhost:4000/api`

## Authentication

All routes are currently public (no authentication required). Authentication should be implemented at the application level.

## API Endpoints

### Health Endpoints

#### Get Health Status

```
GET /health
```

Returns detailed information about the server status.

#### Get Readiness Status

```
GET /health/ready
```

Simple readiness probe for the API.

### Question Endpoints

#### Get Questions (Paginated)

```
GET /questions?page={page}&limit={limit}
```

Returns a paginated list of SAT questions.

**Parameters:**
- `page` (optional): Page number, defaults to 1
- `limit` (optional): Number of questions per page, defaults to 10

**Response:**
```json
{
  "data": {
    "questions": [
      {
        "externalid": "string",
        "stem": "string",
        "stimulus": "string",
        "type": "string",
        "answerOptions": [
          {
            "id": "string",
            "content": "string"
          }
        ],
        "keys": ["string"],
        "rationale": "string",
        "correct_answer": ["string"]
      }
    ],
    "total": 1000,
    "page": 1,
    "limit": 10,
    "pages": 100
  }
}
```

#### Get Question by ID

```
GET /questions/{id}
```

Returns a specific question by its ID.

**Response:**
```json
{
  "data": {
    "externalid": "string",
    "stem": "string",
    "stimulus": "string",
    "type": "string",
    "answerOptions": [
      {
        "id": "string",
        "content": "string"
      }
    ],
    "keys": ["string"],
    "rationale": "string",
    "correct_answer": ["string"]
  }
}
```

#### Get Random Question

```
GET /questions/random
```

Returns a random SAT question.

**Response:**
```json
{
  "data": {
    "externalid": "string",
    "stem": "string",
    "stimulus": "string",
    "type": "string",
    "answerOptions": [
      {
        "id": "string",
        "content": "string"
      }
    ],
    "keys": ["string"],
    "rationale": "string",
    "correct_answer": ["string"]
  }
}
```

#### Get All Question IDs

```
GET /questions/ids
```

Returns an array of all available question IDs.

**Response:**
```json
{
  "data": [
    "string"
  ]
}
```

### Test Endpoints

#### Generate Test

```
POST /tests/generate
```

Generates a new test with random SAT questions and persists it to Firestore.

**Request Body:**
```json
{
  "userId": "string",
  "testName": "string",
  "numQuestions": 10
}
```

**Parameters:**
- `userId` (required): The user ID associated with the test
- `testName` (required): The name for the new test
- `numQuestions` (optional): Number of questions to include in the test, defaults to 10

**Response:**
```json
{
  "success": true,
  "data": {
    "testId": "string",
    "message": "Test generated successfully"
  }
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- 200: Success
- 201: Resource created successfully
- 400: Bad request or validation error
- 404: Resource not found
- 500: Server error