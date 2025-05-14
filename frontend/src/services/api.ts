
// The backend runs on port 4000 as specified in config.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// SAT Question interface
export interface SATQuestion {
  externalid: string;
  stem: string;
  stimulus?: string;
  type: string;
  answerOptions: {
    id: string;
    content: string;
  }[];
  keys: string[];
  rationale?: string;
  correct_answer?: string[];
}

// Question response interface
export interface QuestionResponse {
  questions: SATQuestion[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/**
 * Make an API request (no authentication required)
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    // Make the request without authentication
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Parse the JSON response
    const data = await response.json();

    // Check if response was successful
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return { data: data.data || data };
  } catch (error) {
    console.error('API request error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Health check API
 */
export const checkApiHealth = async (): Promise<ApiResponse<any>> => {
  return apiRequest('/health');
};

/**
 * Get questions with pagination
 */
export const getQuestions = async (page = 1, limit = 10): Promise<ApiResponse<QuestionResponse>> => {
  return apiRequest<QuestionResponse>(`/questions?page=${page}&limit=${limit}`);
};

/**
 * Get a specific question by ID
 */
export const getQuestionById = async (id: string): Promise<ApiResponse<SATQuestion>> => {
  return apiRequest<SATQuestion>(`/questions/${id}`);
};

/**
 * Get a random question
 */
export const getRandomQuestion = async (): Promise<ApiResponse<SATQuestion>> => {
  return apiRequest<SATQuestion>('/questions/random');
};

/**
 * Get all question IDs
 */
export const getQuestionIds = async (): Promise<ApiResponse<string[]>> => {
  return apiRequest<string[]>('/questions/ids');
};

/**
 * Generate a new test in the backend
 */
export const generateTest = async (
  userId: string, 
  testName: string, 
  numQuestions: number
): Promise<ApiResponse<{testId: string}>> => {
  return apiRequest<{testId: string}>('/tests/generate', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      testName,
      numQuestions
    })
  });
};

// Interface for wrong answer in email notifications
export interface WrongAnswer {
  question: string;
  stimulus?: string;  // Optional stimulus text
  options: Array<{ id: string; content: string }>;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
}

/**
 * Send test attempt completion email
 */
export const sendTestAttemptEmail = async (
  userId: string,
  attemptId: string,
  testId: string,
  testName: string,
  score: number,
  totalQuestions: number,
  timeTaken: number,
  wrongAnswers?: WrongAnswer[]
): Promise<ApiResponse<{success: boolean, message: string}>> => {
  return apiRequest<{success: boolean, message: string}>('/email/test-attempt', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      attemptId,
      testId,
      testName,
      score,
      totalQuestions,
      timeTaken,
      wrongAnswers
    })
  });
};

/**
 * Get count of questions in a user's bank
 */
export const getQuestionBankCount = async (userId: string): Promise<ApiResponse<{count: number}>> => {
  return apiRequest<{count: number}>(`/question-bank/count/${userId}`);
};

/**
 * Get all questions in a user's bank
 */
export const getQuestionBankQuestions = async (userId: string): Promise<ApiResponse<{questions: SATQuestion[], count: number}>> => {
  return apiRequest<{questions: SATQuestion[], count: number}>(`/question-bank/${userId}`);
};

/**
 * Populate a user's question bank with all available questions
 */
export const populateQuestionBank = async (userId: string): Promise<ApiResponse<{message: string, count: number}>> => {
  return apiRequest<{message: string, count: number}>('/question-bank/populate', {
    method: 'POST',
    body: JSON.stringify({
      userId
    })
  });
};

/**
 * Check if a user is new (first-time sign in)
 */
export const isNewUser = async (userId: string): Promise<ApiResponse<{isNew: boolean}>> => {
  return apiRequest<{isNew: boolean}>(`/users/${userId}/is-new`);
};

/**
 * Initialize a new user (set up settings and populate question bank)
 */
export const initializeUser = async (userId: string): Promise<ApiResponse<{isNew: boolean, message: string, settings?: any, questionCount?: number, firstTestId?: string}>> => {
  return apiRequest<{isNew: boolean, message: string, settings?: any, questionCount?: number, firstTestId?: string}>('/users/initialize', {
    method: 'POST',
    body: JSON.stringify({
      userId
    })
  });
};

export default {
  apiRequest,
  checkApiHealth,
  getQuestions,
  getQuestionById,
  getRandomQuestion,
  getQuestionIds,
  generateTest,
  sendTestAttemptEmail,
  getQuestionBankCount,
  getQuestionBankQuestions,
  populateQuestionBank,
  isNewUser,
  initializeUser,
};