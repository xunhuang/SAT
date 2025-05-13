import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { SATQuestion } from './services/api';
import TestList from './components/TestList';
import TestView from './components/TestView';
import ApiHealth from './components/ApiHealth';
import Login from './components/Login';

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
              <span className="user-email">{currentUser.email}</span>
              <Login isLoggedIn={true} userEmail={currentUser.email} />
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
            <TestList tests={tests} updateTests={updateTests} />
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