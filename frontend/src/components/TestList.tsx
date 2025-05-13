import { useState } from 'react';
import { getQuestions } from '../services/api';
import { saveTest, deleteTest as deleteFirestoreTest } from '../services/firestoreService';
import { Test } from '../App';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import './TestList.css';

interface TestListProps {
  tests: Test[];
  updateTests: (tests: Test[]) => void;
  isLoadingTests?: boolean;
}

const TestList = ({ tests, updateTests, isLoadingTests = false }: TestListProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const { currentUser } = useAuth();

  // Create a new test by fetching questions from the backend
  const createNewTest = async () => {
    if (!newTestName.trim()) {
      setError('Please enter a test name');
      return;
    }

    if (!currentUser) {
      setError('You must be logged in to create a test');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch a set of questions (10 by default)
      const response = await getQuestions(1, 10);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data && response.data.questions) {
        // Create a new test with the fetched questions
        const newTest: Test = {
          id: `test-${Date.now()}`,
          name: newTestName,
          questions: response.data.questions,
          createdAt: new Date()
        };

        console.log('Saving test to Firestore for user:', currentUser.uid, newTest);
        // Save to Firestore
        await saveTest(currentUser.uid, newTest);
        console.log('Test saved successfully');

        // Add the new test to the local state
        const updatedTests = [...tests, newTest];
        updateTests(updatedTests);
        
        setNewTestName('');
        setIsCreatingTest(false);
      }
    } catch (err) {
      setError('Failed to create test. Please try again.');
      console.error('Error creating test:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete a test
  const deleteTest = async (testId: string) => {
    if (!currentUser) {
      setError('You must be logged in to delete a test');
      return;
    }

    try {
      // Delete from Firestore
      await deleteFirestoreTest(testId);
      
      // Update local state
      const updatedTests = tests.filter(test => test.id !== testId);
      updateTests(updatedTests);
    } catch (err) {
      setError('Failed to delete test. Please try again.');
      console.error('Error deleting test:', err);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Debug function to check Firestore connection
  const debugFirestore = async () => {
    try {
      if (!currentUser) {
        console.error('No user logged in');
        return;
      }
      console.log('Current user ID:', currentUser.uid);

      // Dynamically import to avoid bundling issues
      const { listAllTestDocuments } = await import('../services/testFirestore');
      await listAllTestDocuments();
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return (
    <div className="test-list-container">
      <h1>SAT Practice Tests</h1>

      {/* Debug buttons - remove in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            onClick={debugFirestore}
            style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '0.5rem 1rem',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Debug Firestore
          </button>

          <button
            onClick={async () => {
              if (!currentUser) {
                console.error('No user logged in');
                return;
              }

              try {
                // Modify the createTestDocument function to use the current user ID
                const { createTestDocument } = await import('../services/testFirestore');
                const testId = await createTestDocument();

                // Create a test object and add it to the local state
                const newTest: Test = {
                  id: testId,
                  name: 'Manual Test',
                  questions: [{
                    externalid: '1',
                    stem: 'Test question',
                    type: 'mcq',
                    answerOptions: [
                      { id: 'a', content: 'Option A' },
                      { id: 'b', content: 'Option B' }
                    ],
                    keys: ['a']
                  }],
                  createdAt: new Date()
                };

                // Update the tests list
                const updatedTests = [...tests, newTest];
                updateTests(updatedTests);

                // Reload all tests from Firestore
                const { getUserTests } = await import('../services/firestoreService');
                const userTests = await getUserTests(currentUser.uid);
                updateTests(userTests);
              } catch (error) {
                console.error('Error creating test:', error);
              }
            }}
            style={{
              background: '#d4edda',
              color: '#155724',
              padding: '0.5rem 1rem',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Create Test Document
          </button>
        </div>
      )}

      <div className="test-actions">
        {isCreatingTest ? (
          <div className="create-test-form">
            <input
              type="text"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              placeholder="Enter test name"
              className="test-name-input"
            />
            <div className="form-buttons">
              <button 
                className="create-button"
                onClick={createNewTest}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Test'}
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setIsCreatingTest(false);
                  setNewTestName('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>
        ) : (
          <button 
            className="add-test-button"
            onClick={() => setIsCreatingTest(true)}
          >
            Add New Test
          </button>
        )}
      </div>

      {isLoadingTests ? (
        <div className="test-loader">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
                  opacity=".25"/>
            <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"/>
          </svg>
          <p>Loading your tests...</p>
        </div>
      ) : tests.length === 0 && !isCreatingTest ? (
        <div className="empty-state">
          <p>No tests available yet.</p>
          <p>Click "Add New Test" to create your first practice test!</p>
        </div>
      ) : (
        <div className="tests-grid">
          {tests.map(test => (
            <div key={test.id} className="test-card">
              <div className="test-card-header">
                <h2>{test.name}</h2>
                <button
                  className="delete-test-button"
                  onClick={() => deleteTest(test.id)}
                  aria-label="Delete test"
                >
                  ×
                </button>
              </div>
              <div className="test-card-body">
                <p className="question-count">{test.questions.length} Questions</p>
                <p className="created-date">Created: {formatDate(test.createdAt)}</p>
              </div>
              <div className="test-card-footer">
                <Link to={`/test/${test.id}`} className="start-test-button">
                  Start Practice
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestList;