import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/react";
import { syncUser, getMe } from "../lib/api";
import type { AuthUser, Role } from "../lib/api";
import { setUser as setSentryUser, clearUser as clearSentryUser } from "../lib/sentry";
import { analytics } from "../lib/analytics";
import { setAccessToken, clearAccessToken } from "../lib/api";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isRole: (role: Role) => boolean;
  isMentor: boolean;
  isAdmin: boolean;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const { openSignIn, signOut } = useClerk();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!isSignedIn) return null;
    try {
      return await getToken();
    } catch {
      return null;
    }
  }, [isSignedIn, getToken]);

  const syncUserToBackend = useCallback(async () => {
    if (!isSignedIn || !clerkUser?.primaryEmailAddress?.emailAddress) return;

    try {
      const token = await getToken();
      if (token) {
        setAccessToken(token);
      }

      // Check if there's a signup role preference
      const signupRole = localStorage.getItem("mentorHub_signupRole");
      if (signupRole) {
        localStorage.removeItem("mentorHub_signupRole");
      }

      // Sync user with backend
      const { user: syncedUser, created } = await syncUser(
        clerkUser.primaryEmailAddress.emailAddress
      );
      setUser(syncedUser);
      setSentryUser(syncedUser.id, syncedUser.email);

      if (created) {
        analytics.userSignedUp("clerk");
      }
    } catch (err) {
      console.error("Failed to sync user:", err);
      clearAccessToken();
      setUser(null);
      clearSentryUser();
    }
  }, [isSignedIn, clerkUser, getToken]);

  const refreshUser = useCallback(async () => {
    if (!isSignedIn) {
      setUser(null);
      clearSentryUser();
      clearAccessToken();
      return;
    }

    try {
      const token = await getToken();
      if (token) {
        setAccessToken(token);
      }
      const data = await getMe();
      setUser(data.user);
      setSentryUser(data.user.id, data.user.email);
    } catch {
      // If /me fails, try syncing
      await syncUserToBackend();
    }
  }, [isSignedIn, getToken, syncUserToBackend]);

  // Handle Clerk authentication state changes
  useEffect(() => {
    if (!clerkLoaded) return;

    if (isSignedIn) {
      syncUserToBackend().finally(() => setLoading(false));
    } else {
      setUser(null);
      clearSentryUser();
      clearAccessToken();
      setLoading(false);
    }
  }, [clerkLoaded, isSignedIn, syncUserToBackend]);

  const login = () => {
    openSignIn();
  };

  const logout = async () => {
    setUser(null);
    clearSentryUser();
    clearAccessToken();
    await signOut();
  };

  const isRole = useCallback((role: Role) => user?.role === role, [user]);
  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading || !clerkLoaded,
        login,
        logout,
        refreshUser,
        isRole,
        isMentor,
        isAdmin,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
