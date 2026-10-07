import { useState } from "react";
import { api } from "./api";
import Listings from "./pages/Listings";
import Dashboard from "./pages/Dashboard";
import { Role, User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(() => JSON.parse(localStorage.getItem("user") || "null"));
  const [page, setPage] = useState<"listings" | "dashboard" | "auth">("listings");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", password: "", role: "SEEKER" as Role });

  const submitAuth = async () => {
    try {
      const res = await api<{ token: string; user: User }>(`/auth/${mode}`, { method: "POST", body: f });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser(res.user);
      setPage("dashboard");
    } catch (e) { alert((e as Error).message); }
  };
  const logout = () => { localStorage.clear(); setUser(null); setPage("listings"); };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <h2 style={{ margin: 0, flex: 1 }}>🏠 Real Estate Rental</h2>
        <button onClick={() => setPage("listings")}>Listings</button>
        {user ? (
          <>
            <button onClick={() => setPage("dashboard")}>Dashboard</button>
            <span>{user.name} ({user.role})</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <button onClick={() => setPage("auth")}>Login / Register</button>
        )}
      </nav>

      {page === "listings" && <Listings user={user} />}
      {page === "dashboard" && user && <Dashboard user={user} />}
      {page === "auth" && (
        <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
          <h3>{mode === "login" ? "Login" : "Register"}</h3>
          {mode === "register" && (
            <>
              <input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
                <option value="SEEKER">I'm looking for a place</option>
                <option value="OWNER">I'm a property owner</option>
              </select>
            </>
          )}
          <input placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input placeholder="Password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button onClick={submitAuth}>{mode === "login" ? "Login" : "Create account"}</button>
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "register" : "login"); }}>
            {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
          </a>
        </div>
      )}
    </div>
  );
}
