import { useState } from 'react';
import { useAuth } from './AuthProvider';
import Login from './Login';
import ProtectedContent from './ProtectedContent';
import QuestionBrowser from './QuestionBrowser';
import ApiHealth from './ApiHealth';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home">
      <header className="home-header">
        <div className="nav-bar">
          <h1>SAT Practice</h1>
          {currentUser && (
            <Login
              isLoggedIn={true}
              userEmail={currentUser.email}
            />
          )}
        </div>

        <div className="content">
          {currentUser ? (
            <div>
              <h2>Welcome to SAT Practice</h2>
              <p>Prepare for your SAT with our practice questions.</p>
              
              <ProtectedContent>
                <QuestionBrowser />
              </ProtectedContent>
              
              <ApiHealth />
            </div>
          ) : (
            <div className="login-prompt">
              <h2>Sign in to access SAT practice questions</h2>
              <Login isLoggedIn={false} userEmail={null} />
              
              <ApiHealth />
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default Home;