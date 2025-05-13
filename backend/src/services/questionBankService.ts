import { getFirebaseAdmin } from '../config/firebase';
import questionService from './questionService';
import { SATQuestion } from './questionService';

/**
 * Question Bank Service
 * Handles operations related to a user's Question Bank
 */
export default {
  /**
   * Get the number of questions in a user's bank
   * @param userId User ID
   * @returns Promise<number> Number of questions in the bank
   */
  async getBankQuestionCount(userId: string): Promise<number> {
    try {
      const db = getFirebaseAdmin().firestore();
      
      // Get questions from the user's bank
      const snapshot = await db.collection('questionBanks')
        .doc(userId)
        .collection('questions')
        .count()
        .get();
      
      return snapshot.data().count;
    } catch (error) {
      console.error('Error getting bank question count:', error);
      throw new Error('Failed to retrieve question count');
    }
  },

  /**
   * Get all questions from a user's bank
   * @param userId User ID
   * @returns Promise<SATQuestion[]> Array of questions in the bank
   */
  async getBankQuestions(userId: string): Promise<SATQuestion[]> {
    try {
      const db = getFirebaseAdmin().firestore();
      
      // Get questions from the user's bank
      const snapshot = await db.collection('questionBanks')
        .doc(userId)
        .collection('questions')
        .get();
      
      const questions: SATQuestion[] = [];
      
      snapshot.forEach(doc => {
        questions.push(doc.data() as SATQuestion);
      });
      
      return questions;
    } catch (error) {
      console.error('Error getting bank questions:', error);
      throw new Error('Failed to retrieve questions from bank');
    }
  },

  /**
   * Add a question to a user's bank
   * @param userId User ID
   * @param question Question to add
   */
  async addQuestionToBank(userId: string, question: SATQuestion): Promise<void> {
    try {
      const db = getFirebaseAdmin().firestore();
      
      // Add the question to the user's bank
      await db.collection('questionBanks')
        .doc(userId)
        .collection('questions')
        .doc(question.externalid)
        .set(question);
    } catch (error) {
      console.error('Error adding question to bank:', error);
      throw new Error('Failed to add question to bank');
    }
  },

  /**
   * Populate a user's question bank with all available questions
   * @param userId User ID
   * @returns Promise<number> Number of questions added
   */
  async populateQuestionBank(userId: string): Promise<number> {
    try {
      // Get all question IDs
      const questionIds = await questionService.getAllQuestionIds();
      
      // Batch processing to optimize Firestore operations
      const db = getFirebaseAdmin().firestore();
      const batchSize = 500; // Firestore has a limit of 500 operations per batch
      let totalAdded = 0;
      
      // Process questions in batches
      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = db.batch();
        const currentBatch = questionIds.slice(i, i + batchSize);
        
        // Get full question data for each ID in the batch
        const questions = await Promise.all(
          currentBatch.map(id => questionService.getQuestionById(id))
        );
        
        // Add each question to the batch
        for (const question of questions) {
          const ref = db.collection('questionBanks')
            .doc(userId)
            .collection('questions')
            .doc(question.externalid);
          
          batch.set(ref, question);
        }
        
        // Commit the batch
        await batch.commit();
        totalAdded += currentBatch.length;
        
        console.log(`Added batch of ${currentBatch.length} questions, total so far: ${totalAdded}`);
      }
      
      console.log(`Successfully populated question bank for user ${userId} with ${totalAdded} questions`);
      return totalAdded;
    } catch (error) {
      console.error('Error populating question bank:', error);
      throw new Error('Failed to populate question bank');
    }
  },

  /**
   * Get random questions from the user's bank
   * @param userId User ID
   * @param count Number of questions to retrieve
   * @returns Promise<SATQuestion[]> Array of random questions
   */
  async getRandomQuestionsFromBank(userId: string, count: number): Promise<SATQuestion[]> {
    try {
      // Get total count of questions in the bank
      const totalCount = await this.getBankQuestionCount(userId);
      
      if (totalCount === 0) {
        throw new Error('Question bank is empty');
      }
      
      // If requested count is greater than available, return all questions
      if (count >= totalCount) {
        return this.getBankQuestions(userId);
      }
      
      // Get all questions from the bank
      const allQuestions = await this.getBankQuestions(userId);
      
      // Shuffle the array using Fisher-Yates algorithm
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
      }
      
      // Return the requested number of questions
      return allQuestions.slice(0, count);
    } catch (error) {
      console.error('Error getting random questions from bank:', error);
      throw new Error('Failed to retrieve random questions from bank');
    }
  }
}