import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { getQuestionBankCount, populateQuestionBank } from '../services/api';
import { useLocation } from 'react-router-dom';
import './QuestionBank.css';

const QuestionBank = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Load question count when component mounts or when navigating back to this page
  useEffect(() => {
    if (currentUser) {
      loadQuestionCount();
    }
    
    // Set up a timer to clear success/error messages after 5 seconds
    const messageTimer = setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);
    
    return () => clearTimeout(messageTimer);
  }, [currentUser, location.pathname, lastRefresh]);
  
  // Function to force refresh data
  const refreshData = () => {
    setLastRefresh(Date.now());
  };

  // Load the number of questions in the bank
  const loadQuestionCount = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getQuestionBankCount(currentUser.uid);
      
      if (response.error) {
        console.error('[QuestionBank] Error fetching bank count:', response.error);
        setError(response.error);
        setQuestionCount(0); // Assume empty bank if error
        return;
      }

      setQuestionCount(response.data?.count || 0);
    } catch (err) {
      console.error('[QuestionBank] Error loading question count:', err);
      setError('Failed to load question bank information');
      setQuestionCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Populate the question bank
  const handlePopulate = async () => {
    if (!currentUser) {
      setError('You must be logged in to populate your question bank');
      return;
    }

    setIsPopulating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('[QuestionBank] Starting population for user:', currentUser.uid);
      
      const response = await populateQuestionBank(currentUser.uid);
      
      if (response.error) {
        console.error('[QuestionBank] Error populating bank:', response.error);
        setError(response.error);
        return;
      }

      console.log('[QuestionBank] Population response:', response.data);
      
      // Show success message
      setSuccessMessage(
        `Successfully added ${response.data?.count || 0} questions to your bank!`
      );
      
      // Update the question count
      setQuestionCount(response.data?.count || 0);
    } catch (err) {
      console.error('[QuestionBank] Error in populate:', err);
      setError('Failed to populate question bank. Please try again.');
    } finally {
      setIsPopulating(false);
    }
  };

  // Show loading state if fetching initial data
  if (isLoading && questionCount === null) {
    return (
      <div className="question-bank-container">
        <div className="loading-indicator">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
              opacity=".25"
            />
            <path d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z" />
          </svg>
          <span>Loading question bank...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="question-bank-container">
      <div className="question-bank-header">
        <h2 className="question-bank-title">
          Question Bank
          <span className="question-count">
            Questions available: <span className="question-count-number">{questionCount || 0}</span>
            <button 
              className="refresh-button" 
              onClick={refreshData} 
              title="Refresh question count"
              aria-label="Refresh question count"
            >
              <span className={`refresh-icon ${isLoading ? 'spinning' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
              </span>
            </button>
          </span>
        </h2>
      </div>

      <div className="question-bank-actions">
        <div className="info-block">
          <h3>Your Personal Question Bank</h3>
          <p>
            The Question Bank allows you to store SAT practice questions for use in your tests.
            A larger bank gives you more variety in your practice tests and helps avoid repetition.
          </p>
          <p>
            <strong>Note:</strong> Questions are removed from your bank after they are used in a test.
            This ensures you always get fresh questions and prevents repeats.
          </p>
          <p>
            Click the "Populate Bank" button to add all available questions to your bank.
            This may take a few moments to complete.
          </p>
        </div>
        <div className="action-block">
          <button
            className="populate-button"
            onClick={handlePopulate}
            disabled={isPopulating}
          >
            {isPopulating ? "Populating..." : "Populate Bank"}
          </button>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
        </div>
      </div>

      <div className="bank-status">
        <h3>Question Bank Status</h3>
        <p>
          Your question bank is used when generating new tests. The more questions in your bank,
          the more variety you'll have in your practice tests.
        </p>
        
        <div className="bank-stats">
          <div className="stat-card">
            <h4>Questions Available</h4>
            <div className="stat-value">{questionCount || 0}</div>
          </div>
          <div className="stat-card">
            <h4>Bank Status</h4>
            <div className="stat-value">
              {questionCount === 0 ? '🟠 Empty' : questionCount! < 100 ? '🟡 Partial' : '🟢 Full'}
            </div>
          </div>
          <div className="stat-card">
            <h4>Tests Available</h4>
            <div className="stat-value">
              {Math.floor((questionCount || 0) / 10)}
            </div>
            <div>with 10 questions each</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBank;