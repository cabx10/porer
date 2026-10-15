import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import { User, Message } from "../types";
import { io, Socket } from "socket.io-client";

interface Conv {
  listingId: number;
  listingTitle: string;
  listingPhoto?: string;
  otherUser: { id: number; name: string };
  lastMessage: string;
  date: string;
}

export default function Messages({ user }: { user: User | null }) {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const socketRef = useRef<Socket | null>(null);

  const loadConvs = () => {
    api<Conv[]>("/messages/conversations/list").then(setConvs).catch(console.error);
  };

  useEffect(() => {
    if (user) {
      loadConvs();
      socketRef.current = io("http://localhost:4000");
      socketRef.current.emit("join", user.id.toString());
      
      socketRef.current.on("new_message", (m: Message) => {
        // Update messages if we are in this conversation
        setMessages(prev => {
          // If we have an active chat for this listing and this user
          if (active && m.listingId === active.listingId && 
             (m.senderId === active.otherUser.id || m.receiverId === active.otherUser.id)) {
            return [...prev, m];
          }
          return prev;
        });
        loadConvs();
      });
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user, active]); // Re-bind socket listener if active changes

  const selectConv = (c: Conv) => {
    setActive(c);
    api<Message[]>(`/messages/${c.listingId}/${c.otherUser.id}`).then(setMessages);
  };

  const sendMessage = async () => {
    if (!chatMsg.trim() || !active || !user) return;
    try {
      const m = await api<Message>("/messages", { 
        method: "POST", 
        body: { receiverId: active.otherUser.id, content: chatMsg, listingId: active.listingId } 
      });
      setMessages(prev => [...prev, m]);
      setChatMsg("");
      loadConvs();
    } catch (e) { alert((e as Error).message); }
  };

  if (!user) return <div>Please log in to view messages.</div>;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 100px)", border: "1px solid #ccc", borderRadius: 8, overflow: "hidden" }}>
      {/* Sidebar - Conversations */}
      <div style={{ width: 350, borderRight: "1px solid #ccc", background: "#f9f9f9", overflowY: "auto" }}>
        <h3 style={{ padding: 16, margin: 0, borderBottom: "1px solid #ddd", background: "white" }}>Messages</h3>
        {convs.map(c => (
          <div 
            key={`${c.listingId}_${c.otherUser.id}`}
            onClick={() => selectConv(c)}
            style={{ 
              padding: 12, borderBottom: "1px solid #eee", cursor: "pointer",
              background: active?.listingId === c.listingId && active?.otherUser.id === c.otherUser.id ? "#e6f2ff" : "transparent"
            }}
          >
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 40, height: 40, background: "#ddd", borderRadius: 4, overflow: "hidden" }}>
                {c.listingPhoto && <img src={`http://localhost:4000${c.listingPhoto}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: "bold", fontSize: 14 }}>{c.otherUser.name}</div>
                <div style={{ fontSize: 12, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  🏠 {c.listingTitle}
                </div>
                <div style={{ fontSize: 13, color: "#333", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.lastMessage}
                </div>
              </div>
            </div>
          </div>
        ))}
        {convs.length === 0 && <div style={{ padding: 16, color: "#666" }}>No conversations yet.</div>}
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
        {active ? (
          <>
            <div style={{ padding: 16, borderBottom: "1px solid #ddd", background: "#f5f5f5" }}>
              <h3 style={{ margin: 0 }}>{active.otherUser.name}</h3>
              <div style={{ color: "#666", fontSize: 14 }}>About: <b>{active.listingTitle}</b></div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map(m => {
                const isMine = m.senderId === user.id;
                return (
                  <div key={m.id} style={{ alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                    <div style={{ 
                      padding: "8px 12px", 
                      borderRadius: 16, 
                      background: isMine ? "#0066cc" : "#e9ecef",
                      color: isMine ? "white" : "black"
                    }}>
                      {m.content}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 4, textAlign: isMine ? "right" : "left" }}>
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: 16, borderTop: "1px solid #ddd", display: "flex", gap: 8 }}>
              <input 
                value={chatMsg} 
                onChange={e => setChatMsg(e.target.value)} 
                onKeyPress={e => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..." 
                style={{ flex: 1, padding: "10px", borderRadius: 20, border: "1px solid #ccc" }} 
              />
              <button 
                onClick={sendMessage}
                style={{ padding: "0 20px", borderRadius: 20, background: "#0066cc", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}