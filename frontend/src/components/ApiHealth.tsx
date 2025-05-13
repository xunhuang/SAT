import { useState, useEffect } from 'react';
import { checkApiHealth } from '../services/api';

const ApiHealth = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'up' | 'down'>('checking');
  const [statusText, setStatusText] = useState<string>('Checking API status...');
  const [apiInfo, setApiInfo] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await checkApiHealth();
        
        if (result.data) {
          setApiStatus('up');
          setStatusText('API is online');
          setApiInfo(result.data);
        } else {
          setApiStatus('down');
          setStatusText(`API is offline: ${result.error}`);
        }
      } catch (error) {
        setApiStatus('down');
        setStatusText('API is offline: Could not connect to server');
      }
    };

    checkHealth();
    
    // Set up polling - check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="api-health">
      <div className={`status-indicator ${apiStatus}`}>
        <span className="status-dot"></span>
        <span className="status-text">{statusText}</span>
      </div>
      
      {apiStatus === 'up' && apiInfo && (
        <div className="server-info">
          <p>Server uptime: {Math.floor(apiInfo.uptime / 60)} minutes</p>
          <p>Node version: {apiInfo.nodeVersion}</p>
        </div>
      )}
    </div>
  );
};

export default ApiHealth;