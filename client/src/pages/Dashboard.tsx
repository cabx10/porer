import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarClock, Check, Eye, Home, ImageOff, Inbox, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../auth";
import { useT, formatDateTime, formatPrice } from "../i18n";
import { Appointment, Listing } from "../types";
import { locationText } from "../lib/format";
import { EmptyState, Modal, PageLoader, Spinner, StatusBadge } from "../components/ui";

type Tab = "listings" | "incoming" | "requests";

function MyListings({ items, onDelete }: { items: Listing[]; onDelete: (l: Listing) => void }) {
  const t = useT();
  if (items.length === 0)
    return (
      <EmptyState
        icon={<Home size={22} />}
        title={t("dash.noListings")}
        text={t("dash.noListingsText")}
        action={
          <Link to="/listings/new" className="btn-primary">
            <Plus size={16} /> {t("nav.newListing")}
          </Link>
        }
      />
    );
  return (
    <div className="space-y-3">
      {items.map((l) => (
        <div key={l.id} className="card flex flex-col gap-4 p-3 sm:flex-row sm:items-center">
          <Link to={`/listings/${l.id}`} className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-32">
            {l.photos[0] ? (
              <img src={l.photos[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-slate-400">
                <ImageOff size={20} />
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/listings/${l.id}`} className="line-clamp-1 font-semibold text-slate-900 hover:text-brand-700">
              {l.title}
            </Link>
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{locationText(l)}</p>
            <p className="mt-1.5 text-sm">
              <span className="font-bold text-slate-900">{formatPrice(l.price, t.lang)}</span>
              <span className="text-slate-500"> {t("listing.perMonth")} · {l.area} m² · {t("listing.roomsCount", { n: l.rooms })}</span>
            </p>
          </div>
          <div className="flex gap-2 sm:flex-col lg:flex-row">
            <Link to={`/listings/${l.id}`} className="btn-ghost btn-sm flex-1">
              <Eye size={14} /> {t("dash.view")}
            </Link>
            <Link to={`/listings/${l.id}/edit`} className="btn-secondary btn-sm flex-1">
              <Pencil size={14} /> {t("dash.edit")}
            </Link>
            <button onClick={() => onDelete(l)} className="btn-danger btn-sm flex-1">
              <Trash2 size={14} /> {t("dash.delete")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function IncomingRequests({ items, onDecide }: { items: Appointment[]; onDecide: (id: number, status: "APPROVED" | "REJECTED") => Promise<void> }) {
  const t = useT();
  const [busy, setBusy] = useState<number | null>(null);
  if (items.length === 0) return <EmptyState icon={<Inbox size={22} />} title={t("dash.noIncoming")} text={t("dash.noIncomingText")} />;
  // Pending requests first, then by date.
  const sorted = [...items].sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING") || a.date.localeCompare(b.date));
  return (
    <div className="space-y-3">
      {sorted.map((r) => (
        <div key={r.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <CalendarClock size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">{formatDateTime(r.date, t.lang)}</span>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              <b className="font-medium text-slate-800">{r.seeker?.name}</b> · {r.seeker?.email}
            </p>
            <Link to={`/listings/${r.listing.id}`} className="mt-0.5 line-clamp-1 text-sm text-brand-700 hover:underline">
              {r.listing.title}
            </Link>
            {r.message && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">“{r.message}”</p>}
          </div>
          {r.status === "PENDING" && (
            <div className="flex gap-2">
              <button
                disabled={busy === r.id}
                onClick={async () => {
                  setBusy(r.id);
                  await onDecide(r.id, "REJECTED");
                  setBusy(null);
                }}
                className="btn-danger btn-sm flex-1"
              >
                <X size={14} /> {t("dash.reject")}
              </button>
              <button
                disabled={busy === r.id}
                onClick={async () => {
                  setBusy(r.id);
                  await onDecide(r.id, "APPROVED");
                  setBusy(null);
                }}
                className="btn-primary btn-sm flex-1"
              >
                {busy === r.id ? <Spinner className="h-3.5 w-3.5" /> : <Check size={14} />} {t("dash.approve")}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MyRequests({ items }: { items: Appointment[] }) {
  const t = useT();
  if (items.length === 0)
    return (
      <EmptyState
        icon={<Send size={22} />}
        title={t("dash.noRequests")}
        text={t("dash.noRequestsText")}
        action={
          <Link to="/" className="btn-primary">
            {t("nav.search")}
          </Link>
        }
      />
    );
  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
            <CalendarClock size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <Link to={`/listings/${a.listing.id}`} className="line-clamp-1 font-semibold text-slate-900 hover:text-brand-700">
              {a.listing.title}
            </Link>
            <p className="mt-0.5 text-sm text-slate-600">
              {formatDateTime(a.date, t.lang)}
              {a.listing.city && ` · ${a.listing.city}`}
              {a.listing.price !== undefined && ` · ${formatPrice(a.listing.price, t.lang)} ${t("listing.perMonth")}`}
            </p>
            {a.message && <p className="mt-1 text-sm italic text-slate-500">“{a.message}”</p>}
          </div>
          <StatusBadge status={a.status} />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const t = useT();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as Tab) || "listings";
  const [mine, setMine] = useState<Listing[] | null>(null);
  const [incoming, setIncoming] = useState<Appointment[]>([]);
  const [requests, setRequests] = useState<Appointment[]>([]);
  const [toDelete, setToDelete] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () =>
    Promise.all([api<Listing[]>("/listings/mine"), api<Appointment[]>("/appointments/incoming"), api<Appointment[]>("/appointments/mine")])
      .then(([m, i, r]) => {
        setMine(m);
        setIncoming(i);
        setRequests(r);
      })
      .catch((e) => toast.error((e as Error).message));

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: number, status: "APPROVED" | "REJECTED") => {
    try {
      await api(`/appointments/${id}`, { method: "PATCH", body: { status } });
      setIncoming((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
      toast.success(status === "APPROVED" ? t("dash.approved") : t("dash.rejected"));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/listings/${toDelete.id}`, { method: "DELETE" });
      setMine((list) => list?.filter((l) => l.id !== toDelete.id) ?? null);
      setIncoming((list) => list.filter((a) => a.listing.id !== toDelete.id));
      toast.success(t("dash.deleted"));
      setToDelete(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (mine === null) return <PageLoader />;

  const pending = incoming.filter((a) => a.status === "PENDING").length;
  const tabs: { id: Tab; label: string; count: number; highlight?: boolean }[] = [
    { id: "listings", label: t("dash.tab.listings"), count: mine.length },
    { id: "incoming", label: t("dash.tab.incoming"), count: pending, highlight: pending > 0 },
    { id: "requests", label: t("dash.tab.requests"), count: requests.length },
  ];

  return (
    <div className="page max-w-5xl py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("dash.title")}</h1>
          <p className="mt-1 text-slate-500">{t("dash.greeting", { name: user?.name ?? "" })}</p>
        </div>
        <Link to="/listings/new" className="btn-primary self-start">
          <Plus size={18} /> {t("nav.newListing")}
        </Link>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200 [scrollbar-width:none]">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setParams(tb.id === "listings" ? {} : { tab: tb.id })}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === tb.id ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tb.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tb.highlight ? "bg-amber-100 text-amber-800" : tab === tb.id ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tb.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "listings" && <MyListings items={mine} onDelete={setToDelete} />}
      {tab === "incoming" && <IncomingRequests items={incoming} onDecide={decide} />}
      {tab === "requests" && <MyRequests items={requests} />}

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title={t("dash.deleteTitle")}>
        <div className="space-y-5 p-5">
          <p className="text-sm text-slate-600">{t("dash.deleteText", { title: toDelete?.title ?? "" })}</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setToDelete(null)} className="btn-secondary">
              {t("common.cancel")}
            </button>
            <button onClick={confirmDelete} disabled={deleting} className="btn bg-red-600 text-white hover:bg-red-700">
              {deleting ? <Spinner className="h-4 w-4" /> : <Trash2 size={16} />} {t("dash.delete")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
