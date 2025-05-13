import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface LoginProps {
  isLoggedIn: boolean;
  userEmail: string | null;
}

const Login = ({ isLoggedIn, userEmail }: LoginProps) => {
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="login-container">
      {isLoggedIn ? (
        <div className="logged-in">
          <p>Welcome, {userEmail}</p>
          <button onClick={handleSignOut} className="logout-button">
            Sign Out
          </button>
        </div>
      ) : (
        <div className="logged-out">
          <p>Please sign in to continue</p>
          <button onClick={handleSignIn} className="login-button">
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
};

export default Login;