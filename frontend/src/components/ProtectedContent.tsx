import { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import Login from './Login';

interface ProtectedContentProps {
  children: ReactNode;
}

const ProtectedContent = ({ children }: ProtectedContentProps) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login isLoggedIn={false} userEmail={null} />;
  }

  return <>{children}</>;
};

export default ProtectedContent;