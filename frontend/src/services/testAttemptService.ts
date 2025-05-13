import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { SATQuestion } from './api';
import { Test } from '../App';

/**
 * Represents a user's test attempt with answers and results
 */
export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  userAnswers: Record<string, string>;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: Date;
  testName: string;
  // Store a complete copy of the test questions
  questions: SATQuestion[];
}

/**
 * Save a test attempt to Firestore
 */
export const saveTestAttempt = async (
  userId: string, 
  test: Test, 
  userAnswers: Record<string, string>, 
  score: number
): Promise<string> => {
  try {
    // Generate an ID for the attempt
    const attemptId = `attempt-${Date.now()}`;
    
    // Calculate percentage
    const percentage = Math.round((score / test.questions.length) * 100);
    
    // Create the attempt object with a complete copy of the test questions
    const attempt: TestAttempt = {
      id: attemptId,
      testId: test.id,
      userId,
      userAnswers,
      score,
      totalQuestions: test.questions.length,
      percentage,
      completedAt: new Date(),
      testName: test.name,
      questions: [...test.questions] // Store a complete copy of the questions
    };
    
    // Save to Firestore
    await setDoc(doc(db, 'testAttempts', attemptId), {
      ...attempt,
      completedAt: Timestamp.fromDate(attempt.completedAt)
    });
    
    console.log('Test attempt saved:', attemptId);
    return attemptId;
  } catch (error) {
    console.error('Error saving test attempt:', error);
    throw error;
  }
};

/**
 * Get all test attempts for a user
 */
export const getUserTestAttempts = async (userId: string): Promise<TestAttempt[]> => {
  try {
    console.log('[testAttemptService] Getting attempts for user:', userId);

    // Try with a simpler query first, without ordering
    // This works around potential missing index issues
    const simpleQuery = query(
      collection(db, 'testAttempts'),
      where('userId', '==', userId)
    );

    try {
      // First try with ordering (requires an index)
      const orderedQuery = query(
        collection(db, 'testAttempts'),
        where('userId', '==', userId),
        orderBy('completedAt', 'desc')
      );

      const querySnapshot = await getDocs(orderedQuery);
      console.log('[testAttemptService] Retrieved ordered attempts:', querySnapshot.size);

      const attempts: TestAttempt[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        attempts.push({
          ...data,
          id: doc.id,
          completedAt: data.completedAt?.toDate() || new Date(),
          // Ensure questions array exists (for backward compatibility)
          questions: data.questions || []
        } as TestAttempt);
      });

      return attempts;
    } catch (indexError) {
      console.warn('[testAttemptService] Ordered query failed, falling back to simple query:', indexError);

      // Fallback to the simple query without ordering
      const querySnapshot = await getDocs(simpleQuery);
      console.log('[testAttemptService] Retrieved simple attempts:', querySnapshot.size);

      const attempts: TestAttempt[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        attempts.push({
          ...data,
          id: doc.id,
          completedAt: data.completedAt?.toDate() || new Date(),
          // Ensure questions array exists (for backward compatibility)
          questions: data.questions || []
        } as TestAttempt);
      });

      // Sort manually
      return attempts.sort((a, b) =>
        b.completedAt.getTime() - a.completedAt.getTime()
      );
    }
  } catch (error) {
    console.error('[testAttemptService] Error getting test attempts:', error);
    throw error;
  }
};

/**
 * Get attempts for a specific test by a user
 */
export const getTestAttempts = async (userId: string, testId: string): Promise<TestAttempt[]> => {
  try {
    const attemptsQuery = query(
      collection(db, 'testAttempts'),
      where('userId', '==', userId),
      where('testId', '==', testId),
      orderBy('completedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(attemptsQuery);
    const attempts: TestAttempt[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attempts.push({
        ...data,
        id: doc.id,
        completedAt: data.completedAt.toDate(),
        // Ensure questions array exists (for backward compatibility)
        questions: data.questions || []
      } as TestAttempt);
    });
    
    return attempts;
  } catch (error) {
    console.error('Error getting test attempts for test:', error);
    throw error;
  }
};

/**
 * Get a specific test attempt by ID
 */
export const getTestAttemptById = async (attemptId: string): Promise<TestAttempt | null> => {
  try {
    const docRef = doc(db, 'testAttempts', attemptId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        completedAt: data.completedAt.toDate(),
        // Ensure questions array exists (for backward compatibility)
        questions: data.questions || []
      } as TestAttempt;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting test attempt:', error);
    throw error;
  }
};