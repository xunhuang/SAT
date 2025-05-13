import { useState } from 'react';
import { getQuestions, SATQuestion } from '../services/api';
import { Test } from '../App';
import { Link } from 'react-router-dom';
import './TestList.css';

interface TestListProps {
  tests: Test[];
  updateTests: (tests: Test[]) => void;
}

const TestList = ({ tests, updateTests }: TestListProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [newTestName, setNewTestName] = useState('');

  // Create a new test by fetching questions from the backend
  const createNewTest = async () => {
    if (!newTestName.trim()) {
      setError('Please enter a test name');
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

        // Add the new test to the list using the updateTests prop
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
  const deleteTest = (testId: string) => {
    const updatedTests = tests.filter(test => test.id !== testId);
    updateTests(updatedTests);
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
      <h1>SAT Practice Tests</h1>
      
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

      {tests.length === 0 && !isCreatingTest ? (
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