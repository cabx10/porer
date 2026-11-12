import { FormEvent, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../auth";
import { useSocket } from "../socket";
import { useT, formatTime } from "../i18n";
import { Message } from "../types";
import { Spinner } from "./ui";

/** Conversation with one user about one listing (listingId 0 = general). */
export default function ChatBox({
  listingId,
  otherUserId,
  onSent,
  className = "",
}: {
  listingId: number;
  otherUserId: number;
  onSent?: () => void;
  className?: string;
}) {
  const t = useT();
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(null);
    api<Message[]>(`/messages/${listingId}/${otherUserId}`)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [listingId, otherUserId]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (m: Message) => {
      if ((m.listingId ?? 0) === listingId && m.senderId === otherUserId) {
        setMessages((prev) => (prev ? [...prev, m] : [m]));
      }
    };
    socket.on("new_message", onMessage);
    return () => {
      socket.off("new_message", onMessage);
    };
  }, [socket, listingId, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      const m = await api<Message>("/messages", {
        method: "POST",
        body: { receiverId: otherUserId, content, listingId: listingId || null },
      });
      setMessages((prev) => [...(prev ?? []), m]);
      setText("");
      onSent?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
        {messages === null ? (
          <div className="grid h-full place-items-center text-brand-700">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">{t("messages.startHint")}</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    mine ? "rounded-br-md bg-brand-700 text-white" : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`mt-1 text-right text-[10px] ${mine ? "text-brand-100" : "text-slate-400"}`}>{formatTime(m.createdAt, t.lang)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3">
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("messages.placeholder")} maxLength={2000} />
        <button className="btn-primary px-3.5" disabled={!text.trim() || sending} aria-label={t("messages.send")}>
          {sending ? <Spinner className="h-4 w-4" /> : <SendHorizontal size={18} />}
        </button>
      </form>
    </div>
  );
}
