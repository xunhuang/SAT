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
        <table className="history-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Date</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id}>
                <td className="test-name">{attempt.testName}</td>
                <td className="attempt-date">{formatDate(attempt.completedAt)}</td>
                <td className="attempt-score">
                  {attempt.score} / {attempt.totalQuestions} ({attempt.percentage}%)
                </td>
                <td className="attempt-actions">
                  <Link to={`/review/${attempt.id}`} className="review-button">
                    Review
                  </Link>
                  <Link to={`/retake/${attempt.id}`} className="retake-button">
                    Retake
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TestHistory;