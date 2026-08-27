import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  testFirestoreConnection,
  checkRedirectAuthResult,
  FirebaseService
} from '../services/firebase';

interface AuthErrorInfo {
  code?: string;
  message: string;
  domain?: string;
  isDomainError?: boolean;
}

interface FirebaseContextType {
  user: User | null;
  loadingAuth: boolean;
  isFirebaseConnected: boolean;
  syncStatus: 'connected' | 'offline' | 'connecting' | 'error';
  errorMessage: string | null;
  authError: AuthErrorInfo | null;
  clearAuthError: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'connecting' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);

  useEffect(() => {
    // 1. Listen to Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    // 2. Check for redirect sign in results (useful for environments where popup is restricted)
    checkRedirectAuthResult().then((redirectUser) => {
      if (redirectUser) {
        setUser(redirectUser);
        setSyncStatus('connected');
      }
    }).catch((err) => {
      console.warn("Redirect auth check err:", err);
    });

    // 3. Test Connection
    const initDb = async () => {
      try {
        const connected = await testFirestoreConnection();
        setIsFirebaseConnected(connected);
        if (connected) {
          setSyncStatus('connected');
        } else {
          setSyncStatus('offline');
        }
      } catch (err) {
        console.error("Firebase init error:", err);
        setSyncStatus('error');
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    };

    initDb();

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      setErrorMessage(null);
      setAuthError(null);
      const signedInUser = await loginWithGoogle();
      if (signedInUser) {
        setUser(signedInUser);
        setSyncStatus('connected');
      }
    } catch (err: any) {
      console.error("Sign in failed:", err);
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      const errorCode = err?.code || '';
      const isDomainError = errorCode === 'auth/unauthorized-domain' || (err?.message && err.message.includes('unauthorized-domain'));

      let displayMsg = err instanceof Error ? err.message : 'Sign in failed';
      if (isDomainError) {
        displayMsg = `Domain "${currentHost}" is not authorized in your Firebase Console. Add "${currentHost}" under Firebase Console > Authentication > Settings > Authorized domains.`;
      }

      setErrorMessage(displayMsg);
      setAuthError({
        code: errorCode,
        message: displayMsg,
        domain: currentHost,
        isDomainError
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
    setErrorMessage(null);
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loadingAuth,
        isFirebaseConnected,
        syncStatus,
        errorMessage,
        authError,
        clearAuthError,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
