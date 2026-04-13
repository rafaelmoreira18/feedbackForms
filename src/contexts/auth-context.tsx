import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type { User } from "@/types";
import { api } from "@/services/api";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  activeTenantSlug: string;
  setActiveTenantSlug: (slug: string) => void;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser(): User | null {
  const stored = localStorage.getItem("user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function getStoredTenantSlug(user: User | null): string {
  if (!user) return "";
  // non-global roles always use their own tenantSlug
  if (user.tenantSlug) return user.tenantSlug;
  // holding_admin: restore last selected slug from localStorage
  return localStorage.getItem("activeTenantSlug") ?? "";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [activeTenantSlug, setActiveTenantSlugState] = useState<string>(() =>
    getStoredTenantSlug(getStoredUser())
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveTenantSlug = useCallback((slug: string) => {
    setActiveTenantSlugState(slug);
    if (slug) localStorage.setItem("activeTenantSlug", slug);
    else localStorage.removeItem("activeTenantSlug");
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setActiveTenantSlugState("");
    localStorage.removeItem("user");
    localStorage.removeItem("activeTenantSlug");
    if (timerRef.current) clearTimeout(timerRef.current);
    try { await api.post("auth/logout"); } catch { /* ignore */ }
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousemove", "mousedown", "keypress", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const res = await api.post<{ user: User }>("auth/login", { login: email, password });
      const { user } = res.data;
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      // Sempre limpa o slug anterior para evitar que um tenant de sessão anterior
      // persista quando um usuário diferente (ou com tenant diferente) fizer login.
      localStorage.removeItem("activeTenantSlug");
      const slug = user.tenantSlug ?? "";
      setActiveTenantSlugState(slug);
      if (slug) localStorage.setItem("activeTenantSlug", slug);
      return user;
    } catch (err) {
      console.error('Login error:', err);
      return null;
    }
  };

  const clearMustChangePassword = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, mustChangePassword: false };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        activeTenantSlug,
        setActiveTenantSlug,
        login,
        logout,
        clearMustChangePassword,
      }}
    >
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
