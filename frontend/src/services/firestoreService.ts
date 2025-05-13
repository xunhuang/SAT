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
    console.log('[FirestoreService] Test saved successfully to Firestore');
  } catch (error) {
    console.error('[FirestoreService] Error saving test:', error);
    throw error;
  }
};

/**
 * Retrieves all tests for a specific user
 */
export const getUserTests = async (userId: string): Promise<Test[]> => {
  try {
    console.log('[FirestoreService] Getting tests for user:', userId);

    // First try with composite query (requires an index)
    try {
      const testsQuery = query(
        collection(db, 'tests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(testsQuery);
      console.log('[FirestoreService] Query snapshot size:', querySnapshot.size);

      const tests: Test[] = [];

      querySnapshot.forEach((doc) => {
        const test = firestoreToTest(doc);
        tests.push(test);
      });

      return tests;
    } catch (indexError) {
      // If we get an index error, fallback to simpler query without ordering
      console.warn('[FirestoreService] Index error, falling back to simple query:', indexError);

      const simpleQuery = query(
        collection(db, 'tests'),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(simpleQuery);
      console.log('[FirestoreService] Simple query snapshot size:', querySnapshot.size);

      const tests: Test[] = [];

      querySnapshot.forEach((doc) => {
        const test = firestoreToTest(doc);
        tests.push(test);
      });

      // Sort manually
      return tests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  } catch (error) {
    console.error('[FirestoreService] Error getting tests:', error);
    throw error;
  }
};

/**
 * Deletes a test from Firestore
 */
export const deleteTest = async (testId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tests', testId));
    console.log('[FirestoreService] Test deleted successfully from Firestore');
  } catch (error) {
    console.error('[FirestoreService] Error deleting test:', error);
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
    console.log('[FirestoreService] Test updated successfully in Firestore');
  } catch (error) {
    console.error('[FirestoreService] Error updating test:', error);
    throw error;
  }
};