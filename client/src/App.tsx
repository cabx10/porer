import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import Listings from "./pages/Listings";
import Dashboard from "./pages/Dashboard";
import ListingDetail from "./pages/ListingDetail";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import { User } from "./types";

function Navigation({ user, logout }: any) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: 16 }}>
      <h2 style={{ margin: 0, flex: 1, cursor: "pointer", color: "#0066cc" }} onClick={() => navigate("/")}>🏠 Real Estate Rental</h2>
      <Link to="/" style={{ textDecoration: "none", color: "#333", fontWeight: "bold" }}>Listings</Link>
      {user ? (
        <>
          <Link to="/dashboard" style={{ textDecoration: "none", color: "#333", fontWeight: "bold" }}>Dashboard</Link>
          
          <div style={{ position: "relative" }}>
            <div 
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ cursor: "pointer", fontWeight: "bold", color: "#0066cc", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "#f0f8ff", borderRadius: 20, border: "1px solid #cce5ff" }}
            >
              👤 {user.name} ▼
            </div>
            
            {menuOpen && (
              <div 
                onClick={() => setMenuOpen(false)}
                onMouseLeave={() => setMenuOpen(false)}
                style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: "white", border: "1px solid #ddd", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 1000, minWidth: 200, display: "flex", flexDirection: "column", overflow: "hidden" }}
              >
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", background: "#f9f9f9", color: "#666", fontSize: 13 }}>
                  Signed in as <b>{user.name}</b>
                </div>
                <Link to="/messages" style={{ padding: "12px 16px", textDecoration: "none", color: "#333", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 8 }}>
                  💬 Messages
                </Link>
                <Link to="/profile" style={{ padding: "12px 16px", textDecoration: "none", color: "#333", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 8 }}>
                  ⚙️ Profile Settings
                </Link>
                <div 
                  onClick={logout} 
                  style={{ padding: "12px 16px", cursor: "pointer", color: "#d9534f", display: "flex", alignItems: "center", gap: 8, fontWeight: "bold" }}
                >
                  🚪 Logout
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <Link to="/auth" style={{ textDecoration: "none", color: "#0066cc", fontWeight: "bold", padding: "8px 16px", border: "1px solid #0066cc", borderRadius: 20 }}>Login / Register</Link>
      )}
    </nav>
  );
}

function AuthPage({ user, setUser }: any) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "" });
  const navigate = useNavigate();

  if (user) { navigate("/dashboard"); return null; }

  const submitAuth = async () => {
    try {
      if (mode === "register" && (!f.name || !f.email || !f.password || !f.phone)) {
          alert("Please fill in all fields including phone number.");
          return;
        }
        const payload = mode === "login" ? { email: f.email, password: f.password } : f;
      const res = await api<{ token: string; user: User }>(`/auth/${mode}`, { method: "POST", body: payload });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser(res.user);
      navigate("/dashboard");
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
      <h3>{mode === "login" ? "Login" : "Register"}</h3>
      {mode === "register" && (
        <>
          <input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input placeholder="Phone Number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </>
      )}
      <input placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input placeholder="Password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <button onClick={submitAuth}>{mode === "login" ? "Login" : "Create account"}</button>
      <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "register" : "login"); }}>
        {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
      </a>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
        <Navigation user={user} logout={logout} />
        <Routes>
          <Route path="/" element={<Listings user={user} />} />
          <Route path="/dashboard" element={<Dashboard user={user!} />} />
          <Route path="/listings/:id" element={<ListingDetail user={user} />} />
          <Route path="/messages" element={<Messages user={user} />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="/auth" element={<AuthPage user={user} setUser={setUser} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}