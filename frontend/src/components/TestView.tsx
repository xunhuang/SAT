import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SATQuestion, WrongAnswer } from "../services/api";
import { saveTestAttempt } from "../services/testAttemptService";
import {
  getUserSettings,
  DEFAULT_SETTINGS,
  sendTestAttemptNotifications,
} from "../services/userSettingsService";
import { useAuth } from "../components/AuthProvider";
import "./TestView.css";

interface TestViewProps {
  tests: {
    id: string;
    name: string;
    questions: SATQuestion[];
    createdAt: Date;
  }[];
  fromRetake?: boolean; // Flag to indicate if this test is from a retake
}

const TestView = ({ tests, fromRetake = false }: TestViewProps) => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get the current authenticated user

  // State for test data
  const [currentTest, setCurrentTest] = useState<(typeof tests)[0] | null>(
    null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // State for loading and errors
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const directLoadAttempted = useRef(false);

  // State for saving attempts
  const [attemptSaved, setAttemptSaved] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Log when the component mounts
  useEffect(() => {
    console.log("[TestView] Component mounted");
    return () => {
      console.log("[TestView] Component unmounted");
    };
  }, []);

  // Direct test loading function using Firestore
  const loadTestDirectly = async (testId: string, userId: string) => {
    try {
      console.log("[TestView] Directly loading test from Firestore:", testId);

      // Import here to avoid circular dependencies
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase");

      // Get the test document directly from Firestore
      const testDoc = await getDoc(doc(db, "tests", testId));

      if (!testDoc.exists()) {
        console.error("[TestView] Test document not found in Firestore");
        setErrorMessage(
          "Test not found in database. It may have been deleted."
        );
        return false;
      }

      const data = testDoc.data();

      // Check if the test belongs to the current user
      if (data.userId !== userId) {
        console.error("[TestView] Test belongs to a different user");
        setErrorMessage("You do not have permission to view this test.");
        return false;
      }

      // Convert to Test object
      const testData = {
        id: testDoc.id,
        name: data.name,
        questions: data.questions,
        createdAt: data.createdAt.toDate(),
      };

      console.log(
        "[TestView] Successfully loaded test from Firestore:",
        testData.name
      );

      // Validate questions
      if (
        !testData.questions ||
        !Array.isArray(testData.questions) ||
        testData.questions.length === 0
      ) {
        console.error("[TestView] Test has no valid questions:", testData);
        setErrorMessage("This test has no questions. Please try another test.");
        return false;
      }

      // Set test data
      setCurrentTest(testData);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setShowResults(false);
      setReviewMode(false);

      // Load the user's seconds per question setting
      if (currentUser) {
        getUserSettings(currentUser.uid)
          .then((settings) => {
            setTimeRemaining(
              testData.questions.length * settings.secondsPerQuestion
            );
          })
          .catch((error) => {
            console.error(
              "[TestView] Error loading user settings, using default timer:",
              error
            );
            setTimeRemaining(
              testData.questions.length * DEFAULT_SETTINGS.secondsPerQuestion
            );
          });
      } else {
        setTimeRemaining(
          testData.questions.length * DEFAULT_SETTINGS.secondsPerQuestion
        );
      }

      return true;
    } catch (error) {
      console.error("[TestView] Error loading test directly:", error);
      setErrorMessage("Failed to load test data. Please try again.");
      return false;
    }
  };

  // Find the test on component mount or when tests change
  useEffect(() => {
    const loadTest = async () => {
      console.log("[TestView] Finding test with testId:", testId);
      console.log("[TestView] Available tests from props:", tests);
      console.log("[TestView] Tests array length:", tests.length);
      console.log("[TestView] From retake:", fromRetake);

      // If we're coming from a retake, use the test that was passed in props directly
      if (fromRetake && tests && tests.length === 1) {
        const test = tests[0];
        console.log("[TestView] Using test from retake:", test.name);

        // Validate questions
        if (
          !test.questions ||
          !Array.isArray(test.questions) ||
          test.questions.length === 0
        ) {
          console.error("[TestView] Retake test has no questions:", test);
          setErrorMessage(
            "This test has no questions. Please try another test."
          );
          return;
        }

        // Set test data
        setCurrentTest(test);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setShowResults(false);
        setReviewMode(false);

        // Load the user's seconds per question setting
        if (currentUser) {
          getUserSettings(currentUser.uid)
            .then((settings) => {
              setTimeRemaining(
                test.questions.length * settings.secondsPerQuestion
              );
            })
            .catch((error) => {
              console.error(
                "[TestView] Error loading user settings, using default timer:",
                error
              );
              setTimeRemaining(
                test.questions.length * DEFAULT_SETTINGS.secondsPerQuestion
              );
            });
        } else {
          setTimeRemaining(
            test.questions.length * DEFAULT_SETTINGS.secondsPerQuestion
          );
        }
        return;
      }

      if (!testId) {
        console.error("[TestView] No testId provided");
        setErrorMessage("No test ID provided");
        return;
      }

      // First try to find the test in the provided tests array
      if (tests && tests.length > 0) {
        const test = tests.find((t) => t.id === testId);

        if (test) {
          console.log("[TestView] Test found in props:", test.name);

          // Validate questions
          if (
            !test.questions ||
            !Array.isArray(test.questions) ||
            test.questions.length === 0
          ) {
            console.error("[TestView] Test from props has no questions:", test);
            setErrorMessage(
              "This test has no questions. Please try another test."
            );
            return;
          }

          // Set test data
          setCurrentTest(test);
          setCurrentQuestionIndex(0);
          setUserAnswers({});
          setShowResults(false);
          setReviewMode(false);

          // Load the user's seconds per question setting
          if (currentUser) {
            getUserSettings(currentUser.uid)
              .then((settings) => {
                setTimeRemaining(
                  test.questions.length * settings.secondsPerQuestion
                );
              })
              .catch((error) => {
                console.error(
                  "[TestView] Error loading user settings, using default timer:",
                  error
                );
                setTimeRemaining(
                  test.questions.length * DEFAULT_SETTINGS.secondsPerQuestion
                );
              });
          } else {
            setTimeRemaining(
              test.questions.length * DEFAULT_SETTINGS.secondsPerQuestion
            );
          }
          return;
        }
      }

      // If we didn't find the test in props, or if the tests array is empty,
      // try to load it directly from Firestore (but only once)
      if (!directLoadAttempted.current && currentUser) {
        console.log(
          "[TestView] Test not found in props, loading directly from Firestore"
        );
        directLoadAttempted.current = true; // Mark as attempted
        await loadTestDirectly(testId, currentUser.uid);
      } else if (!directLoadAttempted.current) {
        console.error("[TestView] No current user to load test for");
        setErrorMessage("You must be logged in to view this test.");
        directLoadAttempted.current = true; // Mark as attempted
      }
    };

    loadTest();
  }, [testId, tests, currentUser, fromRetake]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || showResults) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Set up loading timeout

  // Set loading state when component mounts and handle timeouts
  useEffect(() => {
    console.log("[TestView] Setting up initial loading state");
    // Allow some time for test data to be loaded
    const timer = setTimeout(() => {
      console.log("[TestView] Initial loading period complete");
      setInitialLoading(false);

      // If we still don't have a test after the loading period, set an error
      if (!currentTest && tests.length > 0) {
        console.error("[TestView] Test not loaded after timeout");
        setErrorMessage(
          "Unable to load the requested test. It may no longer exist."
        );
      }
    }, 2000); // Give more time for data to load

    return () => clearTimeout(timer);
  }, [currentTest, tests]);

  // Show a big debug button in development
  const showDebugInfo = () => {
    console.log("=== DEBUG INFO ===");
    console.log("Tests available:", tests);
    console.log("Current test ID:", testId);
    console.log("Current test:", currentTest);
    console.log("Initial loading:", initialLoading);
    console.log("Error message:", errorMessage);
    alert("Debug info logged to console");
  };

  // If we're still in the initial loading period or tests haven't loaded yet
  if (initialLoading || (tests.length === 0 && !errorMessage)) {
    return (
      <div className="test-loading">
        <h2>Loading test...</h2>
        <div className="spinner"></div>
        <p>Please wait while we prepare your practice test.</p>
        <div className="debug-section">
          <button className="debug-button" onClick={showDebugInfo}>
            Debug Info
          </button>
        </div>
      </div>
    );
  }

  // If there's an error or no test found after loading
  if (!currentTest) {
    return (
      <div className="test-not-found">
        <h2>Test not found</h2>
        <p>
          {errorMessage ||
            "The requested test could not be found. Please try again or choose another test."}
        </p>
        <button onClick={() => navigate("/")}>Back to Test List</button>
        <div className="debug-section">
          <button className="debug-button" onClick={showDebugInfo}>
            Debug Info
          </button>
        </div>
      </div>
    );
  }

  // Make sure the current question index is valid
  const safeQuestionIndex = Math.min(
    currentQuestionIndex,
    currentTest.questions.length - 1
  );
  if (safeQuestionIndex !== currentQuestionIndex) {
    setCurrentQuestionIndex(safeQuestionIndex);
  }

  // Get the current question safely
  const currentQuestion = currentTest.questions[safeQuestionIndex];

  // Safety check for missing question
  if (!currentQuestion) {
    console.error("Current question not found:", {
      testId,
      safeQuestionIndex,
      questionsLength: currentTest.questions.length,
    });
    return (
      <div className="test-error">
        <h2>Error Loading Question</h2>
        <p>There was a problem loading the question.</p>
        <button onClick={() => navigate("/")}>Back to Test List</button>
      </div>
    );
  }

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answerId: string) => {
    if (showResults) return; // Don't allow changes after submitting

    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  // Check if answer is correct
  const isCorrectAnswer = (questionId: string, answerId: string): boolean => {
    if (!showResults) return false;

    const question = currentTest.questions.find(
      (q) => q.externalid === questionId
    );
    return !!question && question.keys.includes(answerId);
  };

  // Check if answer is incorrect
  const isIncorrectAnswer = (questionId: string, answerId: string): boolean => {
    if (!showResults) return false;

    const question = currentTest.questions.find(
      (q) => q.externalid === questionId
    );
    const userAnswer = userAnswers[questionId];

    return (
      !!question && answerId === userAnswer && !question.keys.includes(answerId)
    );
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

  // Submit test function
  const submitTest = async () => {
    setShowResults(true);
    // Reset to first question to show results page
    setCurrentQuestionIndex(0);

    // Save the test attempt if user is logged in and attempt hasn't been saved yet
    if (currentUser && currentTest && !attemptSaved) {
      try {
        setSavingAttempt(true);
        setSaveError(null);

        // Calculate score and get wrong answers
        const { score, wrongAnswers } = calculateScore();

        // Get time taken (either from timeRemaining or use total allowed time)
        const totalAllowedTime =
          currentTest.questions.length *
          (currentUser
            ? await getUserSettings(currentUser.uid).then(
                (settings) => settings.secondsPerQuestion
              )
            : DEFAULT_SETTINGS.secondsPerQuestion);
        const timeTaken =
          timeRemaining !== null
            ? totalAllowedTime - timeRemaining
            : totalAllowedTime;

        // Save the attempt
        const savedAttemptId = await saveTestAttempt(
          currentUser.uid,
          currentTest,
          userAnswers,
          score
        );

        // Mark as saved
        setAttemptSaved(true);
        console.log("[TestView] Test attempt saved with ID:", savedAttemptId);

        // Send email notification with test attempt details
        console.log("[TestView] Sending test attempt email notification");
        console.log(
          "[TestView] Including",
          wrongAnswers.length,
          "wrong answers in email"
        );
        const emailSent = await sendTestAttemptNotifications(
          currentUser.uid,
          savedAttemptId,
          currentTest.id,
          currentTest.name,
          score,
          currentTest.questions.length,
          timeTaken,
          wrongAnswers
        );

        if (emailSent) {
          console.log(
            "[TestView] Test attempt email notification sent successfully"
          );
        } else {
          console.warn(
            "[TestView] Failed to send test attempt email notification"
          );
        }
      } catch (error) {
        console.error("[TestView] Error saving test attempt:", error);
        setSaveError(
          "There was an error saving your results. Your progress may not be recorded."
        );
      } finally {
        setSavingAttempt(false);
      }
    }
  };

  // Calculate score and collect wrong answers
  const calculateScore = (): {
    score: number;
    total: number;
    percentage: number;
    wrongAnswers: WrongAnswer[];
  } => {
    let correctCount = 0;
    const wrongAnswers: WrongAnswer[] = [];

    currentTest.questions.forEach((question) => {
      const userAnswer = userAnswers[question.externalid];

      // Check if answer is correct
      if (userAnswer && question.keys.includes(userAnswer)) {
        correctCount++;
      } else if (userAnswer) {
        // If wrong answer, collect details for the email
        // Send the raw stimulus - SVG conversion will happen on the backend
        wrongAnswers.push({
          question: question.stem,
          stimulus: question.stimulus || "", // Include raw stimulus with SVG if present
          options: question.answerOptions,
          userAnswer: userAnswer,
          correctAnswer: question.keys[0], // Use first correct answer
          explanation: question.rationale || "No explanation available.",
        });
      }
    });

    return {
      score: correctCount,
      total: currentTest.questions.length,
      percentage: Math.round(
        (correctCount / currentTest.questions.length) * 100
      ),
      wrongAnswers: wrongAnswers,
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
          <p className="score-text">
            You got {score} out of {total} questions correct
          </p>
        </div>

        {/* Show saving status */}
        {currentUser && (
          <div className="save-status">
            {savingAttempt && (
              <p className="saving-message">Saving your results...</p>
            )}
            {attemptSaved && (
              <p className="saved-message">Your results have been saved!</p>
            )}
            {saveError && <p className="save-error">{saveError}</p>}
          </div>
        )}

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
            onClick={() => navigate("/")}
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

            {reviewMode && <div className="review-badge">Review Mode</div>}

            {timeRemaining !== null && !showResults && !reviewMode && (
              <div className="timer">Time: {formatTime(timeRemaining)}</div>
            )}

            <div className="question-progress">
              Question {currentQuestionIndex + 1} of{" "}
              {currentTest.questions.length}
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
                const isCorrect = isCorrectAnswer(
                  currentQuestion.externalid,
                  option.id
                );

                // Determine if this is the user's selected answer
                const isSelected =
                  userAnswers[currentQuestion.externalid] === option.id;

                // For review mode or results, mark correct and incorrect answers
                const showCorrectness = showResults || reviewMode;

                return (
                  <div
                    key={option.id}
                    className={`answer-option
                      ${isSelected ? "selected" : ""}
                      ${showCorrectness && isCorrect ? "correct" : ""}
                      ${
                        showCorrectness &&
                        isIncorrectAnswer(currentQuestion.externalid, option.id)
                          ? "incorrect"
                          : ""
                      }
                    `}
                    onClick={() =>
                      !showResults &&
                      !reviewMode &&
                      handleAnswerSelect(currentQuestion.externalid, option.id)
                    }
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div
                      className="option-content"
                      dangerouslySetInnerHTML={{ __html: option.content }}
                    />

                    {/* Show correct/incorrect indicators in review mode */}
                    {showCorrectness && isCorrect && (
                      <span className="correct-indicator">✓</span>
                    )}
                    {showCorrectness &&
                      isIncorrectAnswer(
                        currentQuestion.externalid,
                        option.id
                      ) && <span className="incorrect-indicator">✗</span>}
                  </div>
                );
              })}
            </div>

            {(showResults || reviewMode) && (
              <div className="question-explanation">
                <h3>Explanation</h3>
                <div
                  className="explanation-content"
                  dangerouslySetInnerHTML={{
                    __html:
                      currentQuestion.rationale || "No explanation available.",
                  }}
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
                  disabled={
                    Object.keys(userAnswers).length <
                    currentTest.questions.length
                  }
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
              <button className="nav-button next" onClick={goToNextQuestion}>
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
