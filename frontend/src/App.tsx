import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './components/AuthProvider';
import { SATQuestion } from './services/api';
import TestList from './components/TestList';
import TestView from './components/TestView';
import ApiHealth from './components/ApiHealth';

// Define Test type for the app
export interface Test {
  id: string;
  name: string;
  questions: SATQuestion[];
  createdAt: Date;
}

function App() {
  // We'll store tests in state at the App level to share between components
  const [tests, setTests] = useState<Test[]>([]);

  // Callback function to update tests from child components
  const updateTests = useCallback((newTests: Test[]) => {
    setTests(newTests);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <div className="app-header">
            <Link to="/" className="app-title">
              <h1>SAT Practice</h1>
            </Link>

            <div className="app-nav">
              <Link to="/" className="nav-link">Tests</Link>
              <Link to="/health" className="nav-link">API Status</Link>
            </div>
          </div>

          <div className="app-content">
            <Routes>
              <Route path="/" element={<TestList tests={tests} updateTests={updateTests} />} />
              <Route path="/test/:testId" element={<TestView tests={tests} />} />
              <Route path="/health" element={<ApiHealth />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;