import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CalendarCheck, ExternalLink, MapPin, MessageCircle, Pencil, Phone, SearchX } from "lucide-react";
import toast from "react-hot-toast";
import { api, ApiError } from "../api";
import { useAuth } from "../auth";
import { useT, formatDate, formatPrice } from "../i18n";
import { Listing } from "../types";
import { locationText } from "../lib/format";
import PhotoGallery from "../components/PhotoGallery";
import MapView from "../components/MapView";
import ChatBox from "../components/ChatBox";
import { ListingSpecs, TypeBadge } from "../components/ListingCard";
import { EmptyState, Field, Modal, PageLoader, Spinner } from "../components/ui";

/** Local "yyyy-MM-ddTHH:mm" for <input type="datetime-local" min>. */
const localNow = () => {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function ViewingForm({ listingId }: { listingId: number }) {
  const t = useT();
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setSending(true);
    try {
      await api("/appointments", { method: "POST", body: { listingId, date: new Date(date).toISOString(), message: note.trim() || undefined } });
      toast.success(t("viewing.sent"));
      setDate("");
      setNote("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={t("viewing.date")}>
        <input type="datetime-local" className="input" min={localNow()} value={date} onChange={(e) => setDate(e.target.value)} required />
      </Field>
      <Field label={t("viewing.note")}>
        <textarea className="input min-h-[72px] resize-none" maxLength={500} placeholder={t("viewing.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <button className="btn-primary w-full" disabled={!date || sending}>
        {sending ? <Spinner className="h-4 w-4" /> : <CalendarCheck size={18} />}
        {t("viewing.request")}
      </button>
    </form>
  );
}

export default function ListingDetail() {
  const t = useT();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "notFound" | "error">("loading");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setStatus("loading");
    if (!/^\d+$/.test(id ?? "")) return setStatus("notFound");
    api<Listing>(`/listings/${id}`)
      .then((l) => {
        setListing(l);
        setStatus("ok");
      })
      .catch((e) => setStatus(e instanceof ApiError && e.status === 404 ? "notFound" : "error"));
  }, [id]);

  if (status === "loading") return <PageLoader />;
  if (status !== "ok" || !listing)
    return (
      <div className="page py-16">
        <EmptyState
          icon={<SearchX size={22} />}
          title={status === "notFound" ? t("detail.notFound") : t("common.loadError")}
          text={status === "notFound" ? t("detail.notFoundText") : undefined}
          action={
            <Link to="/search" className="btn-primary">
              {t("detail.backToListings")}
            </Link>
          }
        />
      </div>
    );

  const l = listing;
  const isOwner = user?.id === l.ownerId;

  return (
    <div className="page py-6">
      <Link to="/search" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300">
        <ArrowLeft size={16} /> {t("detail.backToListings")}
      </Link>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <TypeBadge type={l.type} className="mb-2 bg-brand-50 dark:bg-brand-900/40 shadow-none ring-1 ring-brand-100 dark:ring-brand-800" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{l.title}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <MapPin size={16} /> {locationText(l)}
          </p>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t("detail.published", { date: formatDate(l.createdAt, t.lang) })}</p>
      </div>

      <div className="mb-8">
        <PhotoGallery photos={l.photos} title={l.title} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{t("detail.overview")}</h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                [t("detail.price"), `${formatPrice(l.price, t.lang)} ${t("listing.perMonth")}`],
                [t("detail.area"), `${l.area} m²`],
                [t("detail.rooms"), String(l.rooms)],
                [t("detail.type"), t(`type.${l.type}`)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className="mt-1 font-semibold text-slate-900 dark:text-white">{v}</dd>
                </div>
              ))}
            </dl>
            {l.description && (
              <>
                <h3 className="mb-2 mt-6 font-semibold text-slate-900 dark:text-white">{t("detail.description")}</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300">{l.description}</p>
              </>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t("detail.location")}</h2>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300 hover:underline"
              >
                {t("detail.openInMaps")} <ExternalLink size={14} />
              </a>
            </div>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{[l.address, locationText(l)].filter(Boolean).join(" · ")}</p>
            <MapView className="h-72" markers={[{ id: l.id, lat: l.lat, lng: l.lng }]} center={{ lat: l.lat, lng: l.lng }} zoom={15} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-5 p-5">
            <div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{formatPrice(l.price, t.lang)}</span>
              <span className="ml-1 text-slate-500 dark:text-slate-400">{t("listing.perMonth")}</span>
              <ListingSpecs l={l} className="mt-2" />
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 dark:bg-brand-900/60 font-bold text-brand-800 dark:text-brand-200">
                {l.owner?.name.charAt(0).toLocaleUpperCase("tr")}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("detail.owner")}</p>
                <p className="truncate font-semibold text-slate-900 dark:text-white">{l.owner?.name}</p>
              </div>
              {l.owner?.phone && user && !isOwner && (
                <a href={`tel:${l.owner.phone}`} className="btn-secondary btn-sm ml-auto">
                  <Phone size={14} /> {l.owner.phone}
                </a>
              )}
            </div>

            {isOwner ? (
              <div className="space-y-3">
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{t("detail.yourListing")}</p>
                <Link to={`/listings/${l.id}/edit`} className="btn-secondary w-full">
                  <Pencil size={16} /> {t("detail.edit")}
                </Link>
              </div>
            ) : user ? (
              <>
                <div>
                  <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">{t("viewing.title")}</h3>
                  <ViewingForm listingId={l.id} />
                </div>
                <button onClick={() => setChatOpen(true)} className="btn-secondary w-full">
                  <MessageCircle size={18} /> {t("detail.message")}
                </button>
              </>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">{t("detail.loginToContact")}</p>
                <Link to="/login" state={{ from: location.pathname }} className="btn-primary w-full">
                  {t("nav.login")}
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      {user && !isOwner && (
        <Modal
          open={chatOpen}
          onClose={() => setChatOpen(false)}
          title={
            <span>
              {l.owner?.name} <span className="font-normal text-slate-500 dark:text-slate-400">· {l.title}</span>
            </span>
          }
        >
          <ChatBox listingId={l.id} otherUserId={l.ownerId} className="h-[60vh]" />
        </Modal>
      )}
    </div>
  );
}
