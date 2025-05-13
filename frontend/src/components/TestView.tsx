import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SATQuestion } from '../services/api';
import './TestView.css';

interface TestViewProps {
  tests: {
    id: string;
    name: string;
    questions: SATQuestion[];
    createdAt: Date;
  }[];
}

const TestView = ({ tests }: TestViewProps) => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  
  const [currentTest, setCurrentTest] = useState<typeof tests[0] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Find the test on component mount
  useEffect(() => {
    const test = tests.find(t => t.id === testId);
    if (test) {
      setCurrentTest(test);
      // Reset other state when test changes
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowResults(false);
      setReviewMode(false);
      // Set initial time - 1 minute per question
      setTimeRemaining(test.questions.length * 60);
    } else {
      // Test not found, navigate back to the test list
      navigate('/');
    }
  }, [testId, tests, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev !== null && prev > 0) {
          return prev - 1;
        } else {
          clearInterval(timer);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, showResults]);

  // Format time function
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // No test found
  if (!currentTest) {
    return (
      <div className="test-not-found">
        <h2>Test not found</h2>
        <button onClick={() => navigate('/')}>Back to Test List</button>
      </div>
    );
  }

  // Make sure the current question index is valid
  const safeQuestionIndex = Math.min(currentQuestionIndex, currentTest.questions.length - 1);
  if (safeQuestionIndex !== currentQuestionIndex) {
    setCurrentQuestionIndex(safeQuestionIndex);
  }

  // Get the current question safely
  const currentQuestion = currentTest.questions[safeQuestionIndex];

  // Safety check for missing question
  if (!currentQuestion) {
    console.error('Current question not found:', {
      testId,
      safeQuestionIndex,
      questionsLength: currentTest.questions.length
    });
    return (
      <div className="test-error">
        <h2>Error Loading Question</h2>
        <p>There was a problem loading the question.</p>
        <button onClick={() => navigate('/')}>Back to Test List</button>
      </div>
    );
  }

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    if (showResults) return; // Don't allow changes after submitting
    
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  // Check if answer is correct
  const isCorrectAnswer = (questionId: string, answerId: string): boolean => {
    if (!showResults) return false;
    
    const question = currentTest.questions.find(q => q.externalid === questionId);
    return !!question && question.keys.includes(answerId);
  };

  // Check if answer is incorrect
  const isIncorrectAnswer = (questionId: string, answerId: string): boolean => {
    if (!showResults) return false;
    
    const question = currentTest.questions.find(q => q.externalid === questionId);
    const userAnswer = userAnswers[questionId];
    
    return !!question && answerId === userAnswer && !question.keys.includes(answerId);
  };

  // Navigate to the next question
  const goToNextQuestion = () => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Navigate to the previous question
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit the test
  const submitTest = () => {
    setShowResults(true);
    // Reset to first question to show results page
    setCurrentQuestionIndex(0);
  };

  // Calculate score
  const calculateScore = (): { score: number, total: number, percentage: number } => {
    let correctCount = 0;
    
    currentTest.questions.forEach(question => {
      const userAnswer = userAnswers[question.externalid];
      if (userAnswer && question.keys.includes(userAnswer)) {
        correctCount++;
      }
    });
    
    return {
      score: correctCount,
      total: currentTest.questions.length,
      percentage: Math.round((correctCount / currentTest.questions.length) * 100)
    };
  };

  // Use review mode to control UI differences

  // Render test results
  const renderTestResults = () => {
    const { score, total, percentage } = calculateScore();

    return (
      <div className="test-results">
        <h2>Test Results</h2>
        <div className="score-display">
          <div className="score-circle">
            <span className="score-percentage">{percentage}%</span>
          </div>
          <p className="score-text">You got {score} out of {total} questions correct</p>
        </div>

        <div className="results-actions">
          <button
            className="review-test-button"
            onClick={() => {
              setCurrentQuestionIndex(0);
              setReviewMode(true);
            }}
          >
            Review Questions
          </button>
          <button
            className="back-to-tests-button"
            onClick={() => navigate('/')}
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="test-view-container">
      {showResults && !reviewMode ? (
        renderTestResults()
      ) : (
        <>
          <div className="test-header">
            <h2>{currentTest.name}</h2>

            {reviewMode && (
              <div className="review-badge">
                Review Mode
              </div>
            )}

            {timeRemaining !== null && !showResults && !reviewMode && (
              <div className="timer">
                Time: {formatTime(timeRemaining)}
              </div>
            )}

            <div className="question-progress">
              Question {currentQuestionIndex + 1} of {currentTest.questions.length}
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
                // Determine if this option is the correct answer
                const isCorrect = currentQuestion.keys.includes(option.id);

                // Determine if this is the user's selected answer
                const isSelected = userAnswers[currentQuestion.externalid] === option.id;

                // For review mode or results, mark correct and incorrect answers
                const showCorrectness = showResults || reviewMode;

                return (
                  <div
                    key={option.id}
                    className={`answer-option
                      ${isSelected ? 'selected' : ''}
                      ${showCorrectness && isCorrect ? 'correct' : ''}
                      ${showCorrectness && isSelected && !isCorrect ? 'incorrect' : ''}
                    `}
                    onClick={() => !showResults && !reviewMode && handleAnswerSelect(currentQuestion.externalid, option.id)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <div
                      dangerouslySetInnerHTML={{ __html: option.content }}
                    />

                    {/* Show correct/incorrect indicators in review mode */}
                    {showCorrectness && isCorrect && (
                      <span className="correct-indicator">✓</span>
                    )}
                    {showCorrectness && isSelected && !isCorrect && (
                      <span className="incorrect-indicator">✗</span>
                    )}
                  </div>
                );
              })}
            </div>

            {(showResults || reviewMode) && (
              <div className="question-explanation">
                <h3>Explanation</h3>
                <div
                  className="explanation-content"
                  dangerouslySetInnerHTML={{ __html: currentQuestion.rationale || 'No explanation available.' }}
                />
              </div>
            )}
          </div>
          
          <div className="test-navigation">
            <button
              className="nav-button prev"
              onClick={goToPrevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>

            {reviewMode ? (
              <div className="review-navigation">
                {currentQuestionIndex === currentTest.questions.length - 1 ? (
                  <button
                    className="return-to-results-button"
                    onClick={() => {
                      setReviewMode(false);
                      setCurrentQuestionIndex(0);
                    }}
                  >
                    Return to Results
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
            ) : currentQuestionIndex === currentTest.questions.length - 1 ? (
              !showResults ? (
                <button
                  className="submit-button"
                  onClick={submitTest}
                  disabled={Object.keys(userAnswers).length < currentTest.questions.length}
                >
                  Submit Test
                </button>
              ) : (
                <button
                  className="results-button"
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setReviewMode(false);
                  }}
                >
                  View Results
                </button>
              )
            ) : (
              <button
                className="nav-button next"
                onClick={goToNextQuestion}
              >
                Next
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TestView;