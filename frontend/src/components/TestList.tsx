import { useState, useEffect } from 'react';
import { getQuestions } from '../services/api';
import { saveTest, deleteTest as deleteFirestoreTest } from '../services/firestoreService';
import { getUserSettings, DEFAULT_SETTINGS } from '../services/userSettingsService';
import { Test } from '../App';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';
import TestHistory from './TestHistory';
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
  const [questionCount, setQuestionCount] = useState(DEFAULT_SETTINGS.defaultQuestionCount);
  const { currentUser } = useAuth();

  // Load user's default question count setting
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!currentUser) return;

      try {
        const userSettings = await getUserSettings(currentUser.uid);
        setQuestionCount(userSettings.defaultQuestionCount);
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadUserSettings();
  }, [currentUser]);

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
      // Fetch questions using the user's preferred question count setting
      const response = await getQuestions(1, questionCount);

      if (response.error) {
        console.error('[TestList] Error fetching questions:', response.error);
        setError(response.error);
        return;
      }

      if (!response.data || !response.data.questions || !Array.isArray(response.data.questions)) {
        console.error('[TestList] Invalid response format:', response);
        setError('Received invalid data from the server. Please try again.');
        return;
      }

      if (response.data.questions.length === 0) {
        console.error('[TestList] No questions returned from API');
        setError('No questions available. Please try again later.');
        return;
      }

      // Create a new test with the fetched questions
      const newTest: Test = {
        id: `test-${Date.now()}`,
        name: newTestName,
        questions: response.data.questions,
        createdAt: new Date()
      };

      // Validate test data
      if (!newTest.questions || newTest.questions.length === 0) {
        console.error('[TestList] Created test has no questions:', newTest);
        setError('Failed to create test with questions. Please try again.');
        return;
      }

      // Save to Firestore
      console.log('[TestList] Saving test to Firestore for user:', currentUser.uid);
      console.log('[TestList] Test data:', {
        id: newTest.id,
        name: newTest.name,
        questionCount: newTest.questions.length
      });

      await saveTest(currentUser.uid, newTest);
      console.log('[TestList] Test saved successfully');

      // Add the new test to the local state
      const updatedTests = [...tests, newTest];
      updateTests(updatedTests);

      setNewTestName('');
      setIsCreatingTest(false);
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

  return (
    <div className="test-list-container">
      {/* Main test actions */}
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
                {loading ? "Creating..." : "Create Test"}
              </button>
              <button
                className="cancel-button"
                onClick={() => {
                  setIsCreatingTest(false);
                  setNewTestName("");
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

      {/* Test list */}
      <div className="tests-section">
        <h2>Available Tests</h2>
        {isLoadingTests ? (
          <div className="test-loader">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
                opacity=".25"
              />
              <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
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
            {tests.map((test) => (
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
                  <p className="question-count">
                    {test.questions.length} Questions
                  </p>
                  <p className="created-date">
                    Created: {formatDate(test.createdAt)}
                  </p>
                </div>
                <div className="test-card-footer">
                  <Link
                    to={`/test/${test.id}`}
                    className="start-test-button"
                    onClick={() =>
                      console.log(
                        "[TestList] Starting test:",
                        test.id,
                        test.name
                      )
                    }
                  >
                    Start Practice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test history section */}
      {currentUser && <TestHistory />}
    </div>
  );
};

export default TestList;