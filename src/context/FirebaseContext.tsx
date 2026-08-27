import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  loginWithGoogle, 
  logoutUser, 
  testFirestoreConnection,
  FirebaseService
} from '../services/firebase';

interface FirebaseContextType {
  user: User | null;
  loadingAuth: boolean;
  isFirebaseConnected: boolean;
  syncStatus: 'connected' | 'offline' | 'connecting' | 'error';
  errorMessage: string | null;
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

  useEffect(() => {
    // 1. Listen to Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });

    // 2. Test Connection & Seed initial data if necessary
    const initDb = async () => {
      try {
        const connected = await testFirestoreConnection();
        setIsFirebaseConnected(connected);
        if (connected) {
          setSyncStatus('connected');
          await FirebaseService.seedInitialDataIfEmpty();
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
      await loginWithGoogle();
      setSyncStatus('connected');
    } catch (err) {
      console.error("Sign in failed:", err);
      setErrorMessage(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loadingAuth,
        isFirebaseConnected,
        syncStatus,
        errorMessage,
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
