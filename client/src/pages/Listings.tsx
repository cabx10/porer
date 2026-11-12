import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, List, Map as MapIcon, SearchX, SlidersHorizontal, X } from "lucide-react";
import { api } from "../api";
import { ListingPage } from "../types";
import { useT } from "../i18n";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";
import LocationSelect from "../components/LocationSelect";
import MapView from "../components/MapView";
import { EmptyState, Segmented } from "../components/ui";

const PAGE_SIZE = 12;
const NUMERIC = ["minPrice", "maxPrice", "minArea", "maxArea", "rooms"] as const;
type NumericKey = (typeof NUMERIC)[number];

export default function Listings() {
  const t = useT();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListingPage | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [moreOpen, setMoreOpen] = useState(() => NUMERIC.slice(2).some((k) => params.get(k)));
  const [draft, setDraft] = useState<Record<NumericKey, string>>(
    () => Object.fromEntries(NUMERIC.map((k) => [k, params.get(k) ?? ""])) as Record<NumericKey, string>,
  );

  const get = (k: string) => params.get(k) ?? "";
  const page = Math.max(1, Number(get("page")) || 1);

  // Filters live in the URL, so results are shareable and the back button works.
  useEffect(() => {
    setDraft(Object.fromEntries(NUMERIC.map((k) => [k, params.get(k) ?? ""])) as Record<NumericKey, string>);
    const qs = new URLSearchParams(params);
    qs.set("limit", String(PAGE_SIZE));
    setError(false);
    setData(null);
    api<ListingPage>(`/listings?${qs}`)
      .then(setData)
      .catch(() => setError(true));
  }, [params, reload]);

  const apply = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    setParams(next);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    apply(draft);
  };

  const goToPage = (p: number) => {
    const next = new URLSearchParams(params);
    p > 1 ? next.set("page", String(p)) : next.delete("page");
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeCount = [...NUMERIC, "type", "city"].filter((k) => params.get(k)).length;
  const items = data?.items ?? [];
  const markers = items.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, price: l.price }));

  return (
    <div className="page py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t("home.title")}</h1>
        <p className="mt-1 text-slate-500">{t("home.subtitle")}</p>
      </div>

      <form onSubmit={submit} className="card mb-6 space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Segmented
            className="w-full lg:w-auto"
            value={get("type")}
            onChange={(v) => apply({ type: v })}
            options={[
              { value: "", label: t("type.ALL") },
              { value: "HOME", label: t("type.HOME") },
              { value: "OFFICE", label: t("type.OFFICE") },
            ]}
          />
          <LocationSelect
            allowAll
            className="grid flex-1 gap-3 sm:grid-cols-3"
            value={{ city: get("city"), district: get("district"), neighborhood: get("neighborhood") }}
            onChange={(v) => apply({ ...v })}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <input
              className="input"
              type="number"
              min={0}
              placeholder={t("filter.minPrice")}
              value={draft.minPrice}
              onChange={(e) => setDraft({ ...draft, minPrice: e.target.value })}
            />
            <span className="text-slate-400">–</span>
            <input
              className="input"
              type="number"
              min={0}
              placeholder={t("filter.maxPrice")}
              value={draft.maxPrice}
              onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMoreOpen(!moreOpen)} className="btn-secondary flex-1 sm:flex-none">
              <SlidersHorizontal size={16} /> {t("filter.more")}
            </button>
            <button className="btn-primary flex-1 sm:flex-none sm:px-8">{t("filter.search")}</button>
          </div>
        </div>
        {moreOpen && (
          <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
            <input
              className="input"
              type="number"
              min={0}
              placeholder={t("filter.minArea")}
              value={draft.minArea}
              onChange={(e) => setDraft({ ...draft, minArea: e.target.value })}
            />
            <input
              className="input"
              type="number"
              min={0}
              placeholder={t("filter.maxArea")}
              value={draft.maxArea}
              onChange={(e) => setDraft({ ...draft, maxArea: e.target.value })}
            />
            <input
              className="input"
              type="number"
              min={0}
              placeholder={t("filter.rooms")}
              value={draft.rooms}
              onChange={(e) => setDraft({ ...draft, rooms: e.target.value })}
            />
          </div>
        )}
      </form>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {data ? t("home.resultCount", { n: data.total }) : null}
        </p>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={() => setParams(new URLSearchParams())} className="btn-ghost btn-sm">
              <X size={14} /> {t("filter.clear")}
            </button>
          )}
          <Segmented
            className="lg:hidden"
            value={view}
            onChange={setView}
            options={[
              { value: "list", label: <List size={16} /> },
              { value: "map", label: <MapIcon size={16} /> },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className={view === "map" ? "hidden lg:block" : ""}>
          {error ? (
            <EmptyState icon={<SearchX size={22} />} title={t("common.loadError")} action={<button onClick={() => setReload((n) => n + 1)} className="btn-secondary">{t("common.retry")}</button>} />
          ) : !data ? (
            <div className="grid gap-5 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<SearchX size={22} />}
              title={t("home.emptyTitle")}
              text={t("home.emptyText")}
              action={
                activeCount > 0 && (
                  <button onClick={() => setParams(new URLSearchParams())} className="btn-secondary">
                    {t("filter.clear")}
                  </button>
                )
              }
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {items.map((l) => (
                  <ListingCard key={l.id} l={l} active={hovered === l.id} onHover={setHovered} />
                ))}
              </div>
              {data.pages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-1">
                  <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold ${p === page ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button className="btn-secondary btn-sm" disabled={page >= data.pages} onClick={() => goToPage(page + 1)}>
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>

        <div className={`${view === "list" ? "hidden lg:block" : ""}`}>
          <div className="lg:sticky lg:top-24">
            <MapView
              className="h-[70vh] lg:h-[calc(100vh-8rem)]"
              markers={markers}
              fitToMarkers
              activeId={hovered}
              onHover={setHovered}
              onSelect={(id) => navigate(`/listings/${id}`)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
