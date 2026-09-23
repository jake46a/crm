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

    // 3. Test Connection with fast fallback
    const initDb = async () => {
      try {
        const connected = await testFirestoreConnection(2500);
        setIsFirebaseConnected(connected);
        if (connected) {
          setSyncStatus('connected');
        } else {
          setSyncStatus('offline');
        }
      } catch (err) {
        console.warn("Firebase init connection test:", err);
        setIsFirebaseConnected(false);
        setSyncStatus('offline');
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
      const isCancelledByUser =
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user') ||
        err?.message?.includes('closed-by-user');

      if (isCancelledByUser) {
        // User closed or dismissed the popup - don't show an error toast or modal
        return;
      }

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
