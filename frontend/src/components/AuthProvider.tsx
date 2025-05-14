import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth } from '../firebase';
import { initializeUser, isNewUser } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  initializing: boolean;
  initializationMessage: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  initializing: false,
  initializationMessage: '',
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [initializationMessage, setInitializationMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // If user is signed in, initialize them (this will check if they're new)
      if (user) {
        try {
          console.log('Initializing user:', user.uid);
          
          // Check if user is new first
          const isNewUserResponse = await isNewUser(user.uid);
          
          if (isNewUserResponse.data?.isNew) {
            // Show loading UI for new users
            setInitializing(true);
            setInitializationMessage('Setting up your account...');
            
            // Initialize user
            setInitializationMessage('Populating question bank...');
            const response = await initializeUser(user.uid);
            
            if (response.data?.isNew) {
              setInitializationMessage('Creating your first test...');
              console.log('New user initialized with question bank:', response.data?.questionCount, 'questions');
              console.log('First test created with ID:', response.data?.firstTestId);
              
              // Wait a moment to show the final message
              setInitializationMessage('All done! Redirecting to dashboard...');
              setTimeout(() => {
                setInitializing(false);
                setInitializationMessage('');
                
                // Force refresh the page to ensure all components update properly
                window.location.reload();
              }, 2000);
            }
          } else {
            console.log('Returning user, already initialized');
          }
        } catch (error) {
          console.error('Error initializing user:', error);
          setInitializing(false);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    initializing,
    initializationMessage,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};