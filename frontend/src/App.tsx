import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { SATQuestion } from './services/api';
import TestList from './components/TestList';
import TestView from './components/TestView';
import ReviewAttempt from './components/ReviewAttempt';
import ApiHealth from './components/ApiHealth';
import Login from './components/Login';
import ProfileSettings from './components/ProfileSettings';

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
          <h1>SAT Practice</h1>
        </Link>

        <div className="app-nav">
          {currentUser && (
            <>
              <Link to="/" className="nav-link">Tests</Link>
              <Link to="/health" className="nav-link">API Status</Link>
            </>
          )}
          {currentUser ? (
            <div className="user-info">
              <ProfileSettings />
            </div>
          ) : (
            <Login isLoggedIn={false} userEmail={null} />
          )}
        </div>
      </div>
      
      <div className="app-content">
        {children}
      </div>
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
      <p>Please sign in with your Google account to access practice tests.</p>
      <Login isLoggedIn={false} userEmail={null} />
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
        const userTests = await getUserTests(currentUser.uid);

        console.log('[App] Loaded tests count:', userTests.length);
        console.log('[App] Test IDs:', userTests.map(t => t.id));

        if (userTests.length === 0) {
          console.warn('[App] No tests found for user');
        } else {
          // Verify test data integrity
          const testsWithIssues = userTests.filter(
            test => !test.questions || !Array.isArray(test.questions) || test.questions.length === 0
          );

          if (testsWithIssues.length > 0) {
            console.error('[App] Found tests with missing or invalid questions:', testsWithIssues);
          }
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

      <Route path="/health" element={
        <ProtectedRoute>
          <AppLayout>
            <ApiHealth />
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
        <AppWithAuth />
      </AuthProvider>
    </Router>
  );
}

export default App;