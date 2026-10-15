import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import PhotoGallery from "../components/PhotoGallery";
import MapView from "../components/MapView";
import { Listing, User, Message } from "../types";
import { io, Socket } from "socket.io-client";

export default function ListingDetail({ user }: { user: User | null }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [l, setL] = useState<Listing | null>(null);
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    api<Listing>(`/listings/${id}`).then(setL).catch(() => alert("Listing not found"));
  }, [id]);

  useEffect(() => {
    if (user && l && chatOpen) {
      api<Message[]>(`/messages/${l.id}/${l.ownerId}`).then(setMessages);
      if (!socketRef.current) {
        socketRef.current = io("http://localhost:4000");
        socketRef.current.emit("join", user.id.toString());
        socketRef.current.on("new_message", (m: Message) => {
          if (m.listingId === l.id && (m.senderId === l.ownerId || m.receiverId === l.ownerId)) {
            setMessages((prev) => [...prev, m]);
          }
        });
      }
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, l, chatOpen]);

  if (!l) return <div>Loading...</div>;

  const requestViewing = async () => {
    try {
      const isoDate = new Date(date).toISOString();
      await api("/appointments", { method: "POST", body: { listingId: l.id, date: isoDate, message: msg } });
      alert("Appointment request sent!");
      setDate(""); setMsg("");
    } catch (e) { alert((e as Error).message); }
  };

  const sendMessage = async () => {
    if (!chatMsg.trim()) return;
    try {
      const m = await api<Message>("/messages", { method: "POST", body: { receiverId: l.ownerId, content: chatMsg, listingId: l.id } });
      setMessages([...messages, m]);
      setChatMsg("");
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>← Back</button>
      <div style={{ display: "flex", gap: 20 }}>
        {/* Left Col - Details */}
        <div style={{ flex: 2 }}>
          <h2>{l.title}</h2>
          <h3 style={{ color: "#b00" }}>{l.price.toLocaleString()} ₺</h3>
          <p style={{ color: "#555" }}>{l.neighborhood && l.neighborhood + ", "}{l.district && l.district + ", "}{l.city}</p>
          {l.address && <p style={{ color: "#777", fontSize: 14, marginTop: -10 }}>{l.address}</p>}
          
          {/* Photos */}
          <PhotoGallery photos={l.photos || []} />

          <div style={{ background: "#f9f9f9", padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <h4>Description</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>{l.description}</p>
            <ul style={{ listStyleType: "none", padding: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <li><b>Type:</b> {l.type}</li>
              <li><b>Area:</b> {l.area} m²</li>
              <li><b>Rooms:</b> {l.rooms}</li>
            </ul>
          </div>

          <div style={{ height: 300, marginBottom: 20 }}>
             <MapView markers={[l]} center={{ lat: l.lat, lng: l.lng }} zoom={15} height={300} />
          </div>
        </div>

        {/* Right Col - Actions */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8, position: "sticky", top: 20 }}>
            <h3>Seller: {l.owner?.name}</h3>
            {l.owner?.phone && <p style={{ fontSize: 18, fontWeight: "bold" }}>📞 {l.owner.phone}</p>}
            
            {user && user.id !== l.ownerId ? (
              <>
                <hr style={{ margin: "16px 0" }} />
                <h4>Request Appointment</h4>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                <input placeholder="Optional message" value={msg} onChange={(e) => setMsg(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                <button onClick={requestViewing} disabled={!date} style={{ width: "100%" }}>Request viewing</button>

                <hr style={{ margin: "16px 0" }} />
                <button onClick={() => setChatOpen(!chatOpen)} style={{ width: "100%", background: "#28a745", color: "white", border: "none", padding: 10, borderRadius: 4 }}>
                  💬 Message Seller
                </button>

                {chatOpen && (
                  <div style={{ marginTop: 16, border: "1px solid #ccc", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", height: 300 }}>
                    <div style={{ flex: 1, overflowY: "auto", padding: 8, background: "#f5f5f5" }}>
                      {messages.map(m => (
                        <div key={m.id} style={{ textAlign: m.senderId === user.id ? "right" : "left", marginBottom: 4 }}>
                          <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 12, background: m.senderId === user.id ? "#dcf8c6" : "white", border: "1px solid #ddd" }}>
                            {m.content}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", borderTop: "1px solid #ccc" }}>
                      <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyPress={e => e.key === "Enter" && sendMessage()} placeholder="Type a message..." style={{ flex: 1, border: "none", padding: 8 }} />
                      <button onClick={sendMessage} style={{ border: "none", background: "#0066cc", color: "white", padding: "0 16px" }}>Send</button>
                    </div>
                  </div>
                )}
              </>
            ) : user?.id === l.ownerId ? (
              <p style={{ color: "green" }}>This is your listing.</p>
            ) : (
              <p><a href="/auth">Log in</a> to contact the seller.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}