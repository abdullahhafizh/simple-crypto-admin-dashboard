import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUserData } from "../lib/authStorage";
import {
  clearAuthSession,
  loadAuthToken,
  loadAuthUser,
  saveAuthSession,
} from "../lib/authStorage";

type AuthUser = AuthUserData | null;

type AuthContextValue = {
  user: AuthUser;
  token: string | null;
  login: (user: { username: string }, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => loadAuthToken());

  const [user, setUser] = useState<AuthUser>(() => loadAuthUser());

  const login = (nextUser: { username: string }, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);

    saveAuthSession(nextUser, nextToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    clearAuthSession();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
