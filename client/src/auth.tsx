import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { User } from "./types";
import { useT } from "./i18n";

interface AuthValue {
  user: User | null;
  signIn: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue>(null!);

function readStoredUser(): User | null {
  try {
    return localStorage.getItem("token") ? JSON.parse(localStorage.getItem("user") || "null") : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const t = useT();

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      toast(t("auth.sessionExpired"), { icon: "🔒" });
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [t]);

  const value: AuthValue = {
    user,
    signIn: (token, u) => {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    },
    updateUser: (u) => {
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
    },
    signOut: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}
