import { useState, useEffect } from 'react';
import { generateTest } from '../services/api';
import { deleteTest as deleteFirestoreTest, getUserTests } from '../services/firestoreService';
import { getUserSettings, DEFAULT_SETTINGS, UserSettings } from '../services/userSettingsService';
import eventBus, { EVENTS } from '../services/eventBus';
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

    // Listen for settings updates
    const unsubscribe = eventBus.on(EVENTS.USER_SETTINGS_UPDATED, (updatedSettings: UserSettings) => {
      console.log('[TestList] Received settings update event:', updatedSettings);
      setQuestionCount(updatedSettings.defaultQuestionCount);
    });

    // Clean up the event listener on component unmount
    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Function to generate default test name with user's name and current date
  const generateDefaultTestName = (): string => {
    // Get user's name (or email if no display name)
    const userName = currentUser?.displayName || 
                    (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
    
    // Get current date in format like "May 15, 2025"
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    return `${userName}'s Test - ${currentDate}`;
  };

  // Set default test name when opening create test form
  useEffect(() => {
    if (isCreatingTest && newTestName === '') {
      setNewTestName(generateDefaultTestName());
    }
  }, [isCreatingTest, currentUser]);

  // Create a new test using the backend service
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
      // Get the latest user settings right before creating the test
      try {
        const userSettings = await getUserSettings(currentUser.uid);
        // Update question count with the latest setting
        if (userSettings.defaultQuestionCount !== questionCount) {
          console.log('[TestList] Updating question count from settings:', userSettings.defaultQuestionCount);
          setQuestionCount(userSettings.defaultQuestionCount);
        }
        
        // Use the fresh settings for test creation
        const freshQuestionCount = userSettings.defaultQuestionCount;
        
        // Call the backend to generate and save the test
        const response = await generateTest(currentUser.uid, newTestName, freshQuestionCount);

        if (response.error) {
          console.error('[TestList] Error generating test:', response.error);
          setError(response.error);
          return;
        }

        if (!response.data || !response.data.testId) {
          console.error('[TestList] Invalid response format:', response);
          setError('Received invalid data from the server. Please try again.');
          return;
        }

        console.log('[TestList] Test generated successfully with ID:', response.data.testId);
        
        // Fetch the updated list of tests to get the newly created test
        const userTests = await getUserTests(currentUser.uid);
        updateTests(userTests);

        setNewTestName('');
        setIsCreatingTest(false);
      } catch (settingsError) {
        console.error('[TestList] Error getting fresh settings:', settingsError);
        // Fall back to current state value if settings fetch fails
        
        // Call the backend to generate and save the test
        const response = await generateTest(currentUser.uid, newTestName, questionCount);

        if (response.error) {
          console.error('[TestList] Error generating test:', response.error);
          setError(response.error);
          return;
        }

        if (!response.data || !response.data.testId) {
          console.error('[TestList] Invalid response format:', response);
          setError('Received invalid data from the server. Please try again.');
          return;
        }

        console.log('[TestList] Test generated successfully with ID:', response.data.testId);
        
        // Fetch the updated list of tests to get the newly created test
        const userTests = await getUserTests(currentUser.uid);
        updateTests(userTests);

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
            <div className="question-count-input-container">
              <label htmlFor="question-count">Number of questions:</label>
              <input
                id="question-count"
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                className="question-count-input"
              />
            </div>
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