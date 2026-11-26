import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "./auth";
import { useT } from "./i18n";
import { Message } from "./types";

const SocketContext = createContext<Socket | null>(null);

// One shared connection for the signed-in user; pages subscribe to its events.
export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) return;
    const s = io();
    // Re-join on every (re)connect so the room survives API restarts.
    s.on("connect", () => s.emit("join", String(user.id)));
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      <NewMessageToast socket={socket} />
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

function NewMessageToast({ socket }: { socket: Socket | null }) {
  const location = useLocation();
  const t = useT();
  useEffect(() => {
    if (!socket) return;
    const onMessage = (m: Message) => {
      if (location.pathname.startsWith("/messages")) return;
      toast(t("messages.newToast", { text: m.content.slice(0, 60) }), { icon: "💬" });
    };
    socket.on("new_message", onMessage);
    return () => {
      socket.off("new_message", onMessage);
    };
  }, [socket, location.pathname, t]);
  return null;
}
