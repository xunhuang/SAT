import { useState, useEffect } from 'react';
import { getQuestions, getRandomQuestion, SATQuestion } from '../services/api';
import './QuestionBrowser.css';

const QuestionBrowser = () => {
  const [questions, setQuestions] = useState<SATQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<SATQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch questions on component mount and when page changes
  useEffect(() => {
    fetchQuestions(page);
  }, [page]);

  // Fetch questions with pagination
  const fetchQuestions = async (pageNumber: number) => {
    setLoading(true);
    const response = await getQuestions(pageNumber, 5);
    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    if (response.data) {
      setQuestions(response.data.questions);
      setTotalPages(response.data.pages);
    }
  };

  // Load a random question
  const loadRandomQuestion = async () => {
    setLoading(true);
    setUserAnswer(null);
    setShowRationale(false);

    const response = await getRandomQuestion();
    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    if (response.data) {
      setSelectedQuestion(response.data);
    }
  };

  // Set the currently selected question
  const selectQuestion = (question: SATQuestion) => {
    setSelectedQuestion(question);
    setUserAnswer(null);
    setShowRationale(false);
  };

  // Check if the selected answer is correct
  const isCorrectAnswer = (answerId: string): boolean => {
    if (!selectedQuestion || !userAnswer) return false;
    return selectedQuestion.keys.includes(answerId) && answerId === userAnswer;
  };

  // Check if the selected answer is incorrect
  const isIncorrectAnswer = (answerId: string): boolean => {
    if (!selectedQuestion || !userAnswer) return false;
    return !selectedQuestion.keys.includes(answerId) && answerId === userAnswer;
  };

  // Format the question content to remove HTML tags for display
  const formatContent = (content: string): string => {
    // Simple function to remove basic HTML tags for display
    return content.replace(/<\/?[^>]+(>|$)/g, "");
  };

  // Render the question list
  const renderQuestionList = () => {
    if (loading && questions.length === 0) {
      return <div className="loading">Loading questions...</div>;
    }

    if (error) {
      return <div className="error">Error: {error}</div>;
    }

    if (questions.length === 0) {
      return <div>No questions available. Try fetching some questions first.</div>;
    }

    return (
      <div className="question-list">
        {questions.map((question) => (
          <div
            key={question.externalid}
            className={`question-item ${selectedQuestion?.externalid === question.externalid ? 'selected' : ''}`}
            onClick={() => selectQuestion(question)}
          >
            <div className="question-preview">
              {formatContent(question.stem).substring(0, 100)}...
            </div>
          </div>
        ))}

        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Render the selected question detail
  const renderQuestionDetail = () => {
    if (!selectedQuestion) {
      return (
        <div className="no-question-selected">
          <p>Select a question from the list or load a random question.</p>
          <button onClick={loadRandomQuestion}>Load Random Question</button>
        </div>
      );
    }

    return (
      <div className="question-detail">
        <div
          className="question-stem"
          dangerouslySetInnerHTML={{ __html: selectedQuestion.stem }}
        />

        {selectedQuestion.stimulus && (
          <div
            className="question-stimulus"
            dangerouslySetInnerHTML={{ __html: selectedQuestion.stimulus }}
          />
        )}

        <div className="answer-options">
          {selectedQuestion.answerOptions.map((option, index) => (
            <div
              key={option.id}
              className={`answer-option ${isCorrectAnswer(option.id) ? 'correct' : ''} ${isIncorrectAnswer(option.id) ? 'incorrect' : ''}`}
              onClick={() => !userAnswer && setUserAnswer(option.id)}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <div
                dangerouslySetInnerHTML={{ __html: option.content }}
              />
            </div>
          ))}
        </div>

        {userAnswer && (
          <div className="answer-feedback">
            <p>
              {selectedQuestion.keys.includes(userAnswer)
                ? '✓ Correct!'
                : '✗ Incorrect. Try again.'}
            </p>
            <button
              onClick={() => setShowRationale(!showRationale)}
            >
              {showRationale ? 'Hide Explanation' : 'Show Explanation'}
            </button>
          </div>
        )}

        {showRationale && selectedQuestion.rationale && (
          <div
            className="question-rationale"
            dangerouslySetInnerHTML={{ __html: selectedQuestion.rationale }}
          />
        )}

        <div className="question-actions">
          <button onClick={() => {
            setSelectedQuestion(null);
            setUserAnswer(null);
            setShowRationale(false);
          }}>
            Back to List
          </button>
          <button onClick={loadRandomQuestion}>Next Random Question</button>
        </div>
      </div>
    );
  };

  return (
    <div className="question-browser">
      <h2>SAT Question Browser</h2>
      <p>Browse and practice SAT questions. Select a question from the list or load a random one to start practicing.</p>

      <div className="question-browser-container">
        <div className="sidebar">
          {renderQuestionList()}
        </div>
        <div className="main-content">
          {renderQuestionDetail()}
        </div>
      </div>
    </div>
  );
};

export default QuestionBrowser;