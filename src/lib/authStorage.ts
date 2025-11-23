export type AuthUserData = {
  username: string;
};

const TOKEN_KEY = "authToken";
const USER_KEY = "authUser";

export function loadAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(TOKEN_KEY);
}

export function loadAuthUser(): AuthUserData | null {
  if (typeof window === "undefined") return null;

  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as AuthUserData;
  } catch {
    return null;
  }
}

export function saveAuthSession(user: AuthUserData, token: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
