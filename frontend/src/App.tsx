import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { SATQuestion } from './services/api';
import InitializationOverlay from './components/InitializationOverlay';
import TestList from './components/TestList';
import TestView from './components/TestView';
import ReviewAttempt from './components/ReviewAttempt';
import RetakeTest from './components/RetakeTest';
import ApiHealth from './components/ApiHealth';
import Login from './components/Login';
import ProfileSettings from './components/ProfileSettings';
import QuestionBank from './components/QuestionBank';

// Define Test type for the app
export interface Test {
  id: string;
  name: string;
  questions: SATQuestion[];
  createdAt: Date;
}

// Protected route component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Auth layout component with header
const AppLayout = ({ children }: { children: JSX.Element }) => {
  const { currentUser } = useAuth();

  return (
    <div className="app">
      <div className="app-header">
        <Link to="/" className="app-title">
          <h2>SAT Practice</h2>
        </Link>

        <div className="app-nav">
          {currentUser && (
            <>
              <Link to="/" className="nav-link">
                Tests
              </Link>
              <Link to="/question-bank" className="nav-link">
                Question Bank
              </Link>
              <Link to="/health" className="nav-link">
                API Status
              </Link>
              <div className="user-info">
                <ProfileSettings />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="app-content">{children}</div>
    </div>
  );
};

// Main login page
const LoginPage = () => {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="login-page">
      <h2>Welcome to SAT Practice</h2>
      <p>Sign in with your Google account to create and take practice tests.</p>
      <div className="login-benefits">
        <div className="benefit-item">
          <span className="benefit-icon">📚</span>
          <h3>Practice with Real SAT Questions</h3>
          <p>Access a growing library of SAT-style questions to improve your skills</p>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">📊</span>
          <h3>Track Your Progress</h3>
          <p>Review your test history and see how your performance improves over time</p>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">⏱️</span>
          <h3>Timed Practice</h3>
          <p>Prepare for test day with timed sessions that simulate real testing conditions</p>
        </div>
      </div>
      <div className="login-button-container">
        <Login isLoggedIn={false} userEmail={null} />
      </div>
    </div>
  );
};

function AppWithAuth() {
  // We'll store tests in state at the App level to share between components
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // Load user's tests from Firestore when user logs in
  useEffect(() => {
    const loadUserTests = async () => {
      if (!currentUser) {
        console.log('[App] No current user, clearing tests');
        setTests([]);
        return;
      }

      try {
        setLoading(true);
        console.log('[App] Loading tests for user:', currentUser.uid);

        // Import dynamically to avoid circular dependencies
        const { getUserTests } = await import('./services/firestoreService');

        // Get tests from Firestore
        const userTests = await getUserTests(currentUser.uid);

        console.log('[App] Loaded tests count:', userTests.length);

        if (userTests.length > 0) {
          console.log('[App] First few test IDs:', userTests.slice(0, 3).map(t => t.id));

          // Verify test data integrity
          const testsWithIssues = userTests.filter(
            test => !test.questions || !Array.isArray(test.questions) || test.questions.length === 0
          );

          if (testsWithIssues.length > 0) {
            console.error('[App] Found tests with missing or invalid questions:',
              testsWithIssues.map(t => ({ id: t.id, name: t.name })));
          }
        } else {
          console.warn('[App] No tests found for user');
        }

        setTests(userTests);
      } catch (error) {
        console.error('[App] Error loading tests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserTests();
  }, [currentUser]);

  // Callback function to update tests from child components
  const updateTests = useCallback((newTests: Test[]) => {
    setTests(newTests);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={
        <AppLayout>
          <LoginPage />
        </AppLayout>
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <TestList
              tests={tests}
              updateTests={updateTests}
              isLoadingTests={loading}
            />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/test/:testId" element={
        <ProtectedRoute>
          <AppLayout>
            <TestView tests={tests} />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/review/:attemptId" element={
        <ProtectedRoute>
          <AppLayout>
            <ReviewAttempt />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/retake/:attemptId" element={
        <ProtectedRoute>
          <AppLayout>
            <RetakeTest />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/health" element={
        <ProtectedRoute>
          <AppLayout>
            <ApiHealth />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/question-bank" element={
        <ProtectedRoute>
          <AppLayout>
            <QuestionBank />
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <InitializationOverlay />
        <AppWithAuth />
      </AuthProvider>
    </Router>
  );
}

export default App;