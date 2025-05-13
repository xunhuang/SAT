import { getFirebaseAdmin } from '../config/firebase';
import questionService from './questionService';
import questionBankService from './questionBankService';
import userSettingsService from './userSettingsService';
import emailService from './emailService';
import { v4 as uuidv4 } from 'uuid';

// Define Test type
interface Test {
  id: string;
  name: string;
  questions: any[];
  userId: string;
  createdAt: any; // Firestore timestamp
  questionsFromBank?: boolean; // Flag to indicate if questions came from bank
  bankQuestionIds?: string[]; // IDs of questions to remove from bank
}

/**
 * Test Service
 * Handles test generation and persistence to Firestore
 */
export default {
  /**
   * Generate a new test and save it to Firestore
   * @param userId User ID
   * @param testName Test name
   * @param numQuestions Number of questions to include
   * @returns Promise<string> Test ID
   */
  async generateTest(userId: string, testName: string, numQuestions: number): Promise<string> {
    try {
      let questions = [];

      // Variables to track question bank usage
      let questionsFromBank = false;
      let bankQuestionIds: string[] = [];
      
      // Try to get questions from the user's question bank first
      try {
        // Check if user has a question bank with enough questions
        const bankCount = await questionBankService.getBankQuestionCount(userId);

        if (bankCount >= numQuestions) {
          // User has enough questions in their bank
          console.log(`Using ${numQuestions} questions from user's question bank`);
          questions = await questionBankService.getRandomQuestionsFromBank(userId, numQuestions);
          
          // Track questions from the bank
          questionsFromBank = true;
          bankQuestionIds = questions.map(q => q.externalid);
        } else {
          // Not enough questions in bank, fall back to system questions
          console.log(`Not enough questions in bank (${bankCount}), falling back to system questions`);
          throw new Error('Not enough questions in bank');
        }
      } catch (bankError: any) {
        // Fallback to system questions if bank retrieval fails or not enough questions
        console.log('Falling back to system questions:', bankError.message);

        // Get random questions for the test from the system
        const allIds = await questionService.getAllQuestionIds();
        const totalAvailable = allIds.length;

        // Make sure we don't request more questions than available
        const actualNumQuestions = Math.min(numQuestions, totalAvailable);

        // Randomly select question IDs
        const selectedIds = this.getRandomElements(allIds, actualNumQuestions);

        // Fetch full question data for each selected ID
        const questionPromises = selectedIds.map(id => questionService.getQuestionById(id));
        questions = await Promise.all(questionPromises);
      }
      
      // Generate a unique ID for the test
      const testId = uuidv4();
      
      // Create test object
      const test: Test = {
        id: testId,
        name: testName,
        questions,
        userId,
        createdAt: getFirebaseAdmin().firestore.FieldValue.serverTimestamp(),
        questionsFromBank,
        bankQuestionIds
      };
      
      // Save to Firestore
      await this.saveTestToFirestore(test);
      
      // If questions came from bank, remove them to prevent reuse
      if (questionsFromBank && bankQuestionIds.length > 0) {
        try {
          console.log(`Removing ${bankQuestionIds.length} questions from bank for user ${userId}`);
          await questionBankService.removeQuestionsFromBank(userId, bankQuestionIds);
        } catch (removeError) {
          console.error('Error removing questions from bank:', removeError);
          // Continue even if removal fails - test was still created successfully
        }
      }
      
      // Send email notification about the new test
      try {
        console.log(`Sending email notification for test ${testId}`);
        
        // Get user's email and notification preferences
        const userEmailInfo = await userSettingsService.getUserEmailInfo(userId);
        
        if (userEmailInfo.email) {
          // Send email notification
          const emailSent = await emailService.sendTestNotification(
            testId,
            testName,
            userEmailInfo.email,
            userEmailInfo.notificationEmails
          );
          
          console.log(`Email notification ${emailSent ? 'sent' : 'failed'} for test ${testId}`);
        } else {
          console.warn(`No primary email found for user ${userId}. Skipping notification.`);
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Continue even if email fails - test was still created successfully
      }
      
      return testId;
    } catch (error) {
      console.error('Error generating test:', error);
      throw new Error('Failed to generate test');
    }
  },
  
  /**
   * Save a test to Firestore
   * @param test Test object
   */
  async saveTestToFirestore(test: Test): Promise<void> {
    try {
      const db = getFirebaseAdmin().firestore();
      
      // Add test to the 'tests' collection
      await db.collection('tests').doc(test.id).set(test);
      
      console.log(`Test ${test.id} saved to Firestore for user ${test.userId}`);
    } catch (error) {
      console.error('Error saving test to Firestore:', error);
      throw new Error('Failed to save test to database');
    }
  },
  
  /**
   * Helper function to get random elements from an array
   * @param array Source array
   * @param count Number of elements to select
   */
  getRandomElements<T>(array: T[], count: number): T[] {
    // Create a copy of the array to avoid modifying the original
    const shuffled = [...array];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Return the first 'count' elements
    return shuffled.slice(0, count);
  }
}