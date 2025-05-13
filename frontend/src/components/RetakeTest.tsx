import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { getTestAttemptById } from "../services/testAttemptService";
import TestView from "./TestView";
import { Test } from "../App";

const RetakeTest = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<Test | null>(null);

  // Load the test attempt and create a test object from its questions
  useEffect(() => {
    const loadAttemptForRetake = async () => {
      if (!currentUser || !attemptId) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the attempt data
        const attemptData = await getTestAttemptById(attemptId);

        if (!attemptData) {
          setError("Test attempt not found");
          return;
        }

        // Verify the attempt belongs to the current user
        if (attemptData.userId !== currentUser.uid) {
          setError("You do not have permission to view this test attempt");
          return;
        }

        // Make sure the attempt has questions
        if (!attemptData.questions || attemptData.questions.length === 0) {
          setError("No questions found in this test attempt");
          return;
        }

        // Create a new test object from the attempt's data
        const newTest: Test = {
          id: `retake-${attemptData.testId}-${Date.now()}`,
          name: `${attemptData.testName} (Retake)`,
          questions: attemptData.questions,
          createdAt: new Date(),
        };

        // Set the test data for the TestView component
        setTestData(newTest);
      } catch (err) {
        console.error("Error loading test attempt for retake:", err);
        setError("Failed to load test attempt. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAttemptForRetake();
  }, [attemptId, currentUser, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Preparing your test for retake...</p>
      </div>
    );
  }

  // Show error state
  if (error || !testData) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || "An unexpected error occurred"}</p>
        <button onClick={() => navigate("/")}>Back to Test List</button>
      </div>
    );
  }

  // Render the TestView component with the test created from the attempt
  return <TestView tests={[testData]} fromRetake={true} />;
};

export default RetakeTest;
