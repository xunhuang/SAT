import React from 'react';
import { useAuth } from './AuthProvider';
import './InitializationOverlay.css';

const InitializationOverlay: React.FC = () => {
  const { initializing, initializationMessage } = useAuth();

  if (!initializing) {
    return null;
  }

  return (
    <div className="initialization-overlay">
      <div className="initialization-content">
        <div className="initialization-spinner"></div>
        <h2>Setting Up Your Account</h2>
        <p className="initialization-message">{initializationMessage}</p>
        <p className="initialization-description">
          We're preparing everything for you. This will only happen once and may take a few moments.
        </p>
      </div>
    </div>
  );
};

export default InitializationOverlay;