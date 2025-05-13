import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getUserTestAttempts, TestAttempt } from '../services/testAttemptService';
import './TestHistory.css';

const TestHistory = () => {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  // Load test attempt history for the current user
  useEffect(() => {
    const loadAttempts = async () => {
      if (!currentUser) {
        setAttempts([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userAttempts = await getUserTestAttempts(currentUser.uid);
        setAttempts(userAttempts);
      } catch (err) {
        console.error('Error loading test attempts:', err);
        setError('Failed to load your test history.');
      } finally {
        setLoading(false);
      }
    };

    loadAttempts();
  }, [currentUser]);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="test-history">
      <h2>Your Test History</h2>
      
      {loading ? (
        <div className="loading">Loading your test history...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : attempts.length === 0 ? (
        <div className="empty-history">
          <p>You haven't completed any tests yet.</p>
          <p>Take a test to see your history here!</p>
        </div>
      ) : (
        <div className="attempt-list">
          {attempts.map(attempt => (
            <div key={attempt.id} className="attempt-card">
              <div className="attempt-header">
                <h3>{attempt.testName}</h3>
                <div className="attempt-score">
                  <span className="score-label">Score:</span>
                  <span className="score-value">{attempt.percentage}%</span>
                </div>
              </div>
              
              <div className="attempt-details">
                <p className="attempt-date">
                  Completed on {formatDate(attempt.completedAt)}
                </p>
                <p className="attempt-progress">
                  {attempt.score} out of {attempt.totalQuestions} questions correct
                </p>
              </div>
              
              <div className="attempt-actions">
                <Link
                  to={`/review/${attempt.id}`}
                  className="review-button"
                >
                  Review Attempt
                </Link>
                <Link
                  to={`/retake/${attempt.id}`}
                  className="retake-button"
                >
                  Retake Test
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestHistory;