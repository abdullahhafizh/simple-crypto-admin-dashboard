import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type AuthUser = {
  username: string;
} | null;

type AuthContextValue = {
  user: AuthUser;
  token: string | null;
  login: (user: { username: string }, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const login = (nextUser: { username: string }, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);

    localStorage.setItem("authToken", nextToken);
    localStorage.setItem("authUser", JSON.stringify(nextUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
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
