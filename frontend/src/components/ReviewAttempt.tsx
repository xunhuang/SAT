import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getTestAttemptById, TestAttempt } from '../services/testAttemptService';
import { getUserTests } from '../services/firestoreService';
import { Test } from '../App';
import './TestView.css';
import './ReviewAttempt.css';

const ReviewAttempt = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Load test attempt data
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser || !attemptId) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get test attempt data
        const attemptData = await getTestAttemptById(attemptId);

        if (!attemptData) {
          setError('Test attempt not found');
          return;
        }

        // Verify the attempt belongs to the current user
        if (attemptData.userId !== currentUser.uid) {
          setError('You do not have permission to view this test attempt');
          return;
        }

        setTestAttempt(attemptData);

        // Create test object from the stored questions in the attempt
        // This ensures we can still review even if the original test was deleted
        if (attemptData.questions && attemptData.questions.length > 0) {
          const testData: Test = {
            id: attemptData.testId,
            name: attemptData.testName,
            questions: attemptData.questions,
            createdAt: new Date(0) // Use epoch time as fallback creation date
          };

          setTest(testData);
        } else {
          // For backward compatibility with older attempts that might not have stored questions
          console.log('[ReviewAttempt] Attempt does not have stored questions, falling back to test lookup');

          // Fall back to getting the associated test from the user's tests
          const userTests = await getUserTests(currentUser.uid);
          const testData = userTests.find(t => t.id === attemptData.testId);

          if (!testData) {
            setError('Test data not found. The original test may have been deleted.');
            return;
          }

          setTest(testData);
        }
      } catch (err) {
        console.error('Error loading test attempt:', err);
        setError('Failed to load test attempt. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [attemptId, currentUser, navigate]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your test attempt...</p>
      </div>
    );
  }

  if (error || !testAttempt || !test) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'An unexpected error occurred'}</p>
        <button onClick={() => navigate('/')}>Back to Test List</button>
      </div>
    );
  }

  // Make sure the current question index is valid
  const safeQuestionIndex = Math.min(currentQuestionIndex, test.questions.length - 1);
  if (safeQuestionIndex !== currentQuestionIndex) {
    setCurrentQuestionIndex(safeQuestionIndex);
  }

  // Get the current question safely
  const currentQuestion = test.questions[safeQuestionIndex];

  // Navigate to the next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to the previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Check if an option is the correct one (for highlighting purposes)
  const isCorrectOption = (questionId: string, answerId: string): boolean => {
    const question = test.questions.find(q => q.externalid === questionId);
    return !!question && question.keys.includes(answerId);
  };

  return (
    <div className="test-view-container">
      <div className="test-header">
        <h2>{test.name} - Review</h2>
        
        <div className="review-badge">
          Completed: {testAttempt.completedAt.toLocaleDateString()}
        </div>

        <div className="score-summary">
          Score: {testAttempt.score}/{testAttempt.totalQuestions} ({testAttempt.percentage}%)
        </div>
        
        <div className="question-progress">
          Question {currentQuestionIndex + 1} of {test.questions.length}
        </div>
      </div>
      
      <div className="question-container">
        <div 
          className="question-stem" 
          dangerouslySetInnerHTML={{ __html: currentQuestion.stem }}
        />
        
        {currentQuestion.stimulus && (
          <div 
            className="question-stimulus" 
            dangerouslySetInnerHTML={{ __html: currentQuestion.stimulus }}
          />
        )}
        
        <div className="answer-options">
          {currentQuestion.answerOptions.map((option, index) => {
            const isSelected = testAttempt.userAnswers[currentQuestion.externalid] === option.id;
            const isCorrect = isCorrectOption(currentQuestion.externalid, option.id);
            
            return (
              <div
                key={option.id}
                className={`answer-option 
                  ${isSelected ? 'selected' : ''} 
                  ${isCorrect ? 'correct' : ''} 
                  ${isSelected && !isCorrect ? 'incorrect' : ''}`
                }
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <div
                  className="option-content"
                  dangerouslySetInnerHTML={{ __html: option.content }}
                />
                
                {/* Show correct/incorrect indicators */}
                {isCorrect && (
                  <span className="correct-indicator">✓</span>
                )}
                {isSelected && !isCorrect && (
                  <span className="incorrect-indicator">✗</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="question-explanation">
          <h3>Explanation</h3>
          <div
            className="explanation-content"
            dangerouslySetInnerHTML={{ __html: currentQuestion.rationale || 'No explanation available.' }}
          />
        </div>
      </div>
      
      <div className="test-navigation">
        <button
          className="nav-button prev"
          onClick={goToPrevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>

        {currentQuestionIndex === test.questions.length - 1 ? (
          <button
            className="return-button"
            onClick={() => navigate('/')}
          >
            Return to Tests
          </button>
        ) : (
          <button
            className="nav-button next"
            onClick={goToNextQuestion}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewAttempt;