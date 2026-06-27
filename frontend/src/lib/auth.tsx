import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type UserRole = "student" | "parent" | "teacher" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  school?: string;
  grade?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthUser>;
  register: (data: { fullName: string; email: string; password: string; role?: string }) => Promise<AuthUser>;
  logout: () => void;
}

const STORAGE_KEY = "academixai.session.v1";
const TOKEN_KEY = "academixai.token.v1";

const AuthContext = createContext<AuthContextValue | null>(null);

function mapRole(backendRole: string): UserRole {
  switch (backendRole.toUpperCase()) {
    case "TEACHER": return "teacher";
    case "SCHOOL_ADMIN":
    case "SUPER_ADMIN": return "admin";
    case "PARENT": return "parent";
    default: return "student";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      if (typeof window === "undefined") { setIsLoading(false); return; }
      const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: AuthUser | null, token?: string, remember = true) => {
    setUser(next);
    if (typeof window === "undefined") return;
    const storage = remember ? window.localStorage : window.sessionStorage;
    const other = remember ? window.sessionStorage : window.localStorage;
    if (next) {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (token) storage.setItem(TOKEN_KEY, token);
      other.removeItem(STORAGE_KEY);
      other.removeItem(TOKEN_KEY);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (email, password, remember = true) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? "Email yoki parol noto'g'ri");
    }
    const data = await res.json() as {
      token: string;
      role: string;
      fullName: string;
      email: string;
      userId: number;
    };
    const next: AuthUser = {
      id: String(data.userId),
      email: data.email,
      fullName: data.fullName,
      role: mapRole(data.role),
    };
    persist(next, data.token, remember);
    return next;
  }, [persist]);

  const register = useCallback<AuthContextValue["register"]>(async ({ fullName, email, password, role = "SCHOOL_ADMIN" }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? "Ro'yxatdan o'tishda xato");
    }
    const data = await res.json() as {
      token: string;
      role: string;
      fullName: string;
      email: string;
      userId: number;
    };
    const next: AuthUser = {
      id: String(data.userId),
      email: data.email,
      fullName: data.fullName,
      role: mapRole(data.role),
    };
    persist(next, data.token);
    return next;
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "student": return "/student";
    case "parent": return "/parent";
    case "teacher": return "/teacher";
    case "admin": return "/admin";
  }
}
