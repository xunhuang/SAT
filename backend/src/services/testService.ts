import { getFirebaseAdmin } from '../config/firebase';
import questionService from './questionService';
import { v4 as uuidv4 } from 'uuid';

// Define Test type
interface Test {
  id: string;
  name: string;
  questions: any[];
  userId: string;
  createdAt: any; // Firestore timestamp
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
      // Get random questions for the test
      const allIds = await questionService.getAllQuestionIds();
      const totalAvailable = allIds.length;
      
      // Make sure we don't request more questions than available
      const actualNumQuestions = Math.min(numQuestions, totalAvailable);
      
      // Randomly select question IDs
      const selectedIds = this.getRandomElements(allIds, actualNumQuestions);
      
      // Fetch full question data for each selected ID
      const questionPromises = selectedIds.map(id => questionService.getQuestionById(id));
      const questions = await Promise.all(questionPromises);
      
      // Generate a unique ID for the test
      const testId = uuidv4();
      
      // Create test object
      const test: Test = {
        id: testId,
        name: testName,
        questions,
        userId,
        createdAt: getFirebaseAdmin().firestore.FieldValue.serverTimestamp()
      };
      
      // Save to Firestore
      await this.saveTestToFirestore(test);
      
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