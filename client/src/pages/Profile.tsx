import { useState } from "react";
import { api } from "../api";
import { User } from "../types";

export default function Profile({ user, setUser }: { user: User | null; setUser: (u: User) => void }) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [msg, setMsg] = useState("");

  if (!user) return <div>Please log in.</div>;

  const handleUpdate = async () => {
    setMsg("");
    try {
      const res = await api<{ user: User }>("/auth/profile", {
        method: "PUT",
        body: { name, phone },
      });
      setUser(res.user);
      localStorage.setItem("user", JSON.stringify(res.user));
      setMsg("Profile updated successfully!");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8, display: "grid", gap: 12 }}>
      <h3 style={{ margin: "0 0 10px 0" }}>Profile Settings</h3>
      
      <div style={{ display: "grid", gap: 4 }}>
        <label style={{ fontWeight: "bold" }}>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" style={{ padding: 8 }} />
      </div>
      
      <div style={{ display: "grid", gap: 4 }}>
        <label style={{ fontWeight: "bold" }}>Phone Number</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="05551234567" style={{ padding: 8 }} />
        <small style={{ color: "#666" }}>Must be a valid phone number (e.g., 05551234567 or +905551234567)</small>
      </div>
      
      <button onClick={handleUpdate} style={{ padding: "10px", background: "#0066cc", color: "white", border: "none", borderRadius: 4, cursor: "pointer", marginTop: 10 }}>
        Save Changes
      </button>
      
      {msg && <div style={{ color: msg.includes("successfully") ? "green" : "red", marginTop: 10, fontWeight: "bold", textAlign: "center" }}>{msg}</div>}
    </div>
  );
}