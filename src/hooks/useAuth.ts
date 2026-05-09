import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { generateNickname } from '../lib/nameGenerator';

export interface AppUser {
  uid: string;
  email: string | null;
  nickname: string;
}

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Custom hook that subscribes to Firebase Auth state.
 * Returns the current user, loading flag, and sign-in/sign-out helpers.
 *
 * If Firebase is not configured, returns a no-op state (never loading, no user).
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          if (!db) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              nickname: 'LocalPlayer',
            });
            return;
          }

          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            const nickname = generateNickname();
            await setDoc(userDocRef, {
              uid: firebaseUser.uid,
              nickname,
              createdAt: serverTimestamp(),
            });
            userDoc = await getDoc(userDocRef); // re-fetch to be safe
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nickname: userDoc.data()?.nickname || 'Anonymous',
          });
        } catch (err) {
          console.error('Error fetching/creating user profile:', err);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            nickname: 'Anonymous',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    if (!auth || !googleProvider) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  }, []);

  return { user, loading, signIn, signOut };
}
