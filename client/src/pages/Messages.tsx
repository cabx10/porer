import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Home, MessageCircle } from "lucide-react";
import { api } from "../api";
import { useSocket } from "../socket";
import { useT, formatRelative } from "../i18n";
import { Conversation } from "../types";
import ChatBox from "../components/ChatBox";
import { EmptyState, PageLoader } from "../components/ui";

export default function Messages() {
  const t = useT();
  const socket = useSocket();
  const [params, setParams] = useSearchParams();
  const [convs, setConvs] = useState<Conversation[] | null>(null);

  const load = useCallback(() => {
    api<Conversation[]>("/messages/conversations/list")
      .then(setConvs)
      .catch(() => setConvs([]));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    if (!socket) return;
    socket.on("new_message", load);
    return () => {
      socket.off("new_message", load);
    };
  }, [socket, load]);

  // The open conversation is kept in the URL (?l=listingId&u=userId).
  const listingId = params.get("l");
  const userId = params.get("u");
  const active = convs?.find((c) => String(c.listingId) === listingId && String(c.otherUser.id) === userId);

  if (convs === null) return <PageLoader />;

  return (
    <div className="page py-6">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-slate-900">{t("nav.messages")}</h1>
      {convs.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={22} />}
          title={t("messages.empty")}
          text={t("messages.emptyText")}
          action={
            <Link to="/" className="btn-primary">
              {t("nav.search")}
            </Link>
          }
        />
      ) : (
        <div className="card grid h-[calc(100vh-12rem)] min-h-[480px] overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`min-h-0 overflow-y-auto border-r border-slate-200 ${active ? "hidden md:block" : ""}`}>
            {convs.map((c) => {
              const selected = c === active;
              return (
                <button
                  key={`${c.listingId}_${c.otherUser.id}`}
                  onClick={() => setParams({ l: String(c.listingId), u: String(c.otherUser.id) })}
                  className={`flex w-full gap-3 border-b border-slate-100 p-3.5 text-left transition ${selected ? "bg-brand-50" : "hover:bg-slate-50"}`}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {c.listingPhoto ? (
                      <img src={c.listingPhoto} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-400">
                        <Home size={18} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold text-slate-900">{c.otherUser.name}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">{formatRelative(c.date, t.lang)}</span>
                    </div>
                    <p className="truncate text-xs font-medium text-brand-700">{c.listingId ? c.listingTitle : t("messages.general")}</p>
                    <p className="truncate text-sm text-slate-500">{c.lastMessage}</p>
                  </div>
                </button>
              );
            })}
          </aside>

          {active ? (
            <section className="flex min-h-0 flex-col">
              <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                <button onClick={() => setParams({})} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden" aria-label={t("common.back")}>
                  <ArrowLeft size={18} />
                </button>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{active.otherUser.name}</p>
                  {active.listingId ? (
                    <Link to={`/listings/${active.listingId}`} className="truncate text-xs text-brand-700 hover:underline">
                      {active.listingTitle}
                    </Link>
                  ) : (
                    <p className="text-xs text-slate-500">{t("messages.general")}</p>
                  )}
                </div>
              </header>
              <ChatBox key={`${active.listingId}_${active.otherUser.id}`} listingId={active.listingId} otherUserId={active.otherUser.id} onSent={load} className="flex-1" />
            </section>
          ) : (
            <div className="hidden place-items-center text-center text-slate-500 md:grid">
              <div>
                <MessageCircle size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm">{t("messages.select")}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
