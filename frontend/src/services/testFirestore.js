// Test utility to manually add a test to Firestore
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Creates a test document in Firestore
 */
export const createTestDocument = async (userId) => {
  try {
    // Get the current user ID from Firebase Authentication
    const auth = (await import('firebase/auth')).getAuth();
    const currentUser = auth.currentUser;

    if (!userId && !currentUser) {
      throw new Error('No user ID provided and no user is logged in');
    }

    // Use the provided userId or get from current user
    const userIdToUse = userId || currentUser.uid;
    console.log('Creating test document for user:', userIdToUse);

    // Generate a unique ID
    const testId = `manual-test-${Date.now()}`;

    // Create a dummy test document
    const testData = {
      name: 'Manual Test',
      questions: [
        {
          id: '1',
          externalid: '1',
          stem: 'Test question',
          type: 'mcq',
          answerOptions: [
            { id: 'a', content: 'Option A' },
            { id: 'b', content: 'Option B' }
          ],
          keys: ['a']
        }
      ],
      createdAt: new Date(),
      userId: userIdToUse
    };

    // Add document to Firestore
    await setDoc(doc(db, 'tests', testId), testData);
    console.log('Manual test document created with ID:', testId);
    return testId;
  } catch (error) {
    console.error('Error creating test document:', error);
    throw error;
  }
};

/**
 * List all test documents in Firestore
 */
export const listAllTestDocuments = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'tests'));
    
    console.log('Total documents in tests collection:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      console.log('Document ID:', doc.id);
      console.log('Document data:', doc.data());
    });
  } catch (error) {
    console.error('Error listing test documents:', error);
    throw error;
  }
};

// Call this function from browser console with a real user ID:
// import('/src/services/testFirestore.js').then(m => m.createTestDocument('USER_ID_HERE'))

// To list all documents:
// import('/src/services/testFirestore.js').then(m => m.listAllTestDocuments())