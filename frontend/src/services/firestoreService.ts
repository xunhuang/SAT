import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Test } from '../App';
import { SATQuestion } from './api';

/**
 * Converts a Firestore test document to a Test object
 */
const firestoreToTest = (doc: any): Test => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    questions: data.questions,
    createdAt: data.createdAt.toDate()
  };
};

/**
 * Saves a test to Firestore under the user's collection
 */
export const saveTest = async (userId: string, test: Test): Promise<void> => {
  try {
    const testDoc = {
      name: test.name,
      questions: test.questions,
      createdAt: Timestamp.fromDate(test.createdAt),
      userId
    };
    
    // Use the test's ID as the document ID
    await setDoc(doc(db, 'tests', test.id), testDoc);
    console.log('Test saved successfully');
  } catch (error) {
    console.error('Error saving test:', error);
    throw error;
  }
};

/**
 * Retrieves all tests for a specific user
 */
export const getUserTests = async (userId: string): Promise<Test[]> => {
  try {
    console.log('Querying Firestore for tests with userId:', userId);

    // First try with composite query (requires an index)
    try {
      const testsQuery = query(
        collection(db, 'tests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(testsQuery);
      console.log('Query snapshot size:', querySnapshot.size);

      const tests: Test[] = [];

      querySnapshot.forEach((doc) => {
        console.log('Document data:', doc.id, doc.data());
        tests.push(firestoreToTest(doc));
      });

      return tests;
    } catch (indexError) {
      // If we get an index error, fallback to simpler query without ordering
      console.warn('Index error, falling back to simple query:', indexError);

      const simpleQuery = query(
        collection(db, 'tests'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(simpleQuery);
      console.log('Simple query snapshot size:', querySnapshot.size);

      const tests: Test[] = [];

      querySnapshot.forEach((doc) => {
        console.log('Simple query document data:', doc.id, doc.data());
        tests.push(firestoreToTest(doc));
      });

      // Sort manually
      return tests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  } catch (error) {
    console.error('Error getting tests:', error);
    throw error;
  }
};

/**
 * Deletes a test from Firestore
 */
export const deleteTest = async (testId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tests', testId));
    console.log('Test deleted successfully');
  } catch (error) {
    console.error('Error deleting test:', error);
    throw error;
  }
};

/**
 * Updates an existing test in Firestore
 */
export const updateTest = async (userId: string, test: Test): Promise<void> => {
  try {
    const testDoc = {
      name: test.name,
      questions: test.questions,
      createdAt: Timestamp.fromDate(test.createdAt),
      userId
    };
    
    await setDoc(doc(db, 'tests', test.id), testDoc, { merge: true });
    console.log('Test updated successfully');
  } catch (error) {
    console.error('Error updating test:', error);
    throw error;
  }
};