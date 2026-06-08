"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  restoreAdminSession,
  signInWithGoogle,
  type AuthenticatedAdmin,
} from "@/lib/auth/google-auth";
import { getFirebaseClient } from "@/shared/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  admin: AuthenticatedAdmin | null;
  loading: boolean;
  googleLoading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<AuthenticatedAdmin>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AuthenticatedAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      const { auth } = getFirebaseClient();

      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        setUser(currentUser);

        if (!currentUser) {
          setAdmin(null);
          setLoading(false);
          return;
        }

        try {
          const restoredAdmin = await restoreAdminSession(currentUser);
          setAdmin(restoredAdmin);
        } catch {
          setAdmin(null);
        } finally {
          setLoading(false);
        }
      });
    } catch {
      setAdmin(null);
      setUser(null);
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const authenticatedAdmin = await signInWithGoogle();
      setAdmin(authenticatedAdmin);
      return authenticatedAdmin;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in with Google.";
      setError(message);
      throw new Error(message);
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const { auth } = getFirebaseClient();

    await Promise.allSettled([
      signOut(auth),
      fetch("/api/auth/logout", {
        method: "POST",
      }),
    ]);

    setUser(null);
    setAdmin(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      admin,
      loading,
      googleLoading,
      error,
      loginWithGoogle,
      logout,
      clearError: () => setError(null),
    }),
    [admin, error, googleLoading, loading, loginWithGoogle, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
