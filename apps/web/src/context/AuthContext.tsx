import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from "../lib/api";
import type { AuthUser, Role } from "../lib/api";
import { setUser as setSentryUser, clearUser as clearSentryUser } from "../lib/sentry";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  register: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isRole: (role: Role) => boolean;
  isMentor: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user);
      setSentryUser(data.user.id, data.user.email);
    } catch {
      setUser(null);
      clearSentryUser();
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    const data = await apiLogin(email, password, recaptchaToken);
    setUser(data.user);
    setSentryUser(data.user.id, data.user.email);
  };

  const register = async (email: string, password: string, recaptchaToken?: string) => {
    const data = await apiRegister(email, password, recaptchaToken);
    setUser(data.user);
    setSentryUser(data.user.id, data.user.email);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    clearSentryUser();
  };

  const isRole = useCallback((role: Role) => user?.role === role, [user]);
  const isMentor = user?.role === "MENTOR" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isRole,
        isMentor,
        isAdmin,
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
