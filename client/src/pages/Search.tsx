import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpDown, ChevronLeft, ChevronRight, LayoutGrid, Map as MapIcon, MapPin, SearchX, SlidersHorizontal, X } from "lucide-react";
import { api } from "../api";
import { Listing, ListingPage } from "../types";
import { useT, formatPrice } from "../i18n";
import { coverPhoto, locationText } from "../lib/format";
import ListingCard, { ListingCardSkeleton, ListingSpecs } from "../components/ListingCard";
import LocationSelect from "../components/LocationSelect";
import MapView from "../components/MapView";
import { EmptyState, Modal, Segmented } from "../components/ui";
import { locationData } from "../utils/locations";

const PAGE_SIZE = 12;
const MAP_LIMIT = 50; // the API's maximum page size

export const ROOM_PRESETS = [
  { id: "1", label: "1+1" },
  { id: "2", label: "2+1" },
  { id: "3", label: "3+1" },
  { id: "4", label: "4+1" },
  { id: "5+", label: "5+" },
];

/** Parses room numbers from formats like "2+1", "3", "4+1" (takes number before '+') */
export function parseRoomInput(val: string): string[] {
  if (!val) return [];
  const parts = val.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const result: string[] = [];
  for (const part of parts) {
    if (part === "5+" || part === "5_plus" || part === "5plus") {
      if (!result.includes("5+")) result.push("5+");
    } else if (part.includes("+")) {
      const beforePlus = part.split("+")[0].trim();
      const n = parseInt(beforePlus, 10);
      if (!isNaN(n) && n >= 0) {
        const strVal = String(n);
        if (!result.includes(strVal)) result.push(strVal);
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 0) {
        const strVal = String(n);
        if (!result.includes(strVal)) result.push(strVal);
      }
    }
  }
  return result;
}

const FILTER_KEYS = [
  "type",
  "city",
  "district",
  "neighborhood",
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "rooms",
  "sort",
] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
type Filters = Record<FilterKey, string>;

const readFilters = (p: URLSearchParams) =>
  Object.fromEntries(FILTER_KEYS.map((k) => [k, p.get(k) ?? ""])) as Filters;

function RangeInputs({
  min,
  max,
  onMin,
  onMax,
  placeholderMin,
  placeholderMax,
  suffix,
}: {
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  placeholderMin: string;
  placeholderMax: string;
  suffix: string;
}) {
  const input = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className="relative flex-1">
      <input
        className="input pr-8"
        type="number"
        min={0}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
        {suffix}
      </span>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      {input(min, onMin, placeholderMin)}
      <span className="text-slate-300">–</span>
      {input(max, onMax, placeholderMax)}
    </div>
  );
}

/** The filter form; used in the desktop sidebar and in the mobile drawer. */
function FilterPanel({
  initial,
  onApply,
  onClear,
}: {
  initial: Filters;
  onApply: (f: Filters) => void;
  onClear: () => void;
}) {
  const t = useT();
  const [f, setF] = useState(initial);
  const [roomInput, setRoomInput] = useState("");

  useEffect(() => setF(initial), [JSON.stringify(initial)]);
  const set = (k: FilterKey) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));
  const section = "space-y-2.5 border-b border-slate-100 dark:border-slate-800 pb-5";
  const heading = "text-sm font-semibold text-slate-900 dark:text-white";

  const selectedRooms = f.rooms
    ? f.rooms.split(",").map((r) => r.trim()).filter(Boolean)
    : [];

  const toggleRoomPreset = (id: string) => {
    const next = selectedRooms.includes(id)
      ? selectedRooms.filter((r) => r !== id)
      : [...selectedRooms, id];
    set("rooms")(next.join(","));
  };

  const addRoomFromInput = () => {
    if (!roomInput.trim()) return;
    const parsed = parseRoomInput(roomInput);
    if (parsed.length > 0) {
      const next = Array.from(new Set([...selectedRooms, ...parsed]));
      set("rooms")(next.join(","));
      setRoomInput("");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = parseRoomInput(roomInput);
        const finalRooms = Array.from(new Set([...selectedRooms, ...parsed]));
        onApply({ ...f, rooms: finalRooms.join(",") });
        setRoomInput("");
      }}
      className="space-y-5"
    >
      <div className={section}>
        <h3 className={heading}>{t("sort.title")}</h3>
        <select
          className="input"
          value={f.sort || "newest"}
          onChange={(e) => set("sort")(e.target.value)}
        >
          <option value="newest">{t("sort.newest")}</option>
          <option value="oldest">{t("sort.oldest")}</option>
          <option value="price_asc">{t("sort.priceAsc")}</option>
          <option value="price_desc">{t("sort.priceDesc")}</option>
        </select>
      </div>

      <div className={section}>
        <h3 className={heading}>{t("filter.type")}</h3>
        <Segmented
          className="w-full"
          value={f.type}
          onChange={set("type")}
          options={[
            { value: "", label: t("type.ALL") },
            { value: "HOME", label: t("type.HOME") },
            { value: "OFFICE", label: t("type.OFFICE") },
          ]}
        />
      </div>

      <div className={section}>
        <h3 className={heading}>{t("filter.location")}</h3>
        <LocationSelect
          allowAll
          multiDistrict
          className="space-y-2.5"
          value={f}
          onChange={(v) => setF((prev) => ({ ...prev, ...v }))}
        />
      </div>

      <div className={section}>
        <h3 className={heading}>{t("filter.rent")}</h3>
        <RangeInputs
          min={f.minPrice}
          max={f.maxPrice}
          onMin={set("minPrice")}
          onMax={set("maxPrice")}
          placeholderMin={t("filter.min")}
          placeholderMax={t("filter.max")}
          suffix="₺"
        />
      </div>

      <div className={section}>
        <h3 className={heading}>{t("filter.area")}</h3>
        <RangeInputs
          min={f.minArea}
          max={f.maxArea}
          onMin={set("minArea")}
          onMax={set("maxArea")}
          placeholderMin={t("filter.min")}
          placeholderMax={t("filter.max")}
          suffix="m²"
        />
      </div>

      <div className="space-y-3.5">
        <h3 className={heading}>{t("filter.rooms")}</h3>

        {/* Ready room presets (multi-select) */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("filter.roomPresets")}
          </span>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
            {ROOM_PRESETS.map((p) => {
              const isSelected = selectedRooms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleRoomPreset(p.id)}
                  className={`h-9 rounded-xl border text-xs font-semibold transition ${
                    isSelected
                      ? "border-brand-700 bg-brand-700 text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Room input (custom sayı veya 2+1 formatı) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("filter.roomInput")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              className="input h-9 py-1 text-xs flex-1"
              placeholder={t("filter.roomInputPlaceholder")}
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRoomFromInput();
                }
              }}
            />
            {roomInput.trim() && (
              <button
                type="button"
                onClick={addRoomFromInput}
                className="btn-secondary btn-sm h-9 px-2.5 text-xs font-semibold"
              >
                {t("filter.addRoom")}
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t("filter.roomInputHint")}
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            setRoomInput("");
            onClear();
          }}
          className="btn-ghost flex-1"
        >
          {t("filter.reset")}
        </button>
        <button className="btn-primary flex-[2]">{t("filter.apply")}</button>
      </div>
    </form>
  );
}

function MapPreview({ l, onClose }: { l: Listing; onClose: () => void }) {
  const t = useT();
  const photo = coverPhoto(l);
  return (
    <div className="card absolute bottom-4 left-4 right-4 z-10 flex overflow-hidden sm:left-auto sm:w-[420px]">
      <Link to={`/listings/${l.id}`} className="h-auto w-36 shrink-0 bg-slate-100 dark:bg-slate-800">
        {photo && <img src={photo} alt="" className="h-full w-full object-cover" />}
      </Link>
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {formatPrice(l.price, t.lang)}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> {t("listing.perMonth")}</span>
          </p>
          <button onClick={onClose} className="-mr-1 -mt-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="close">
            <X size={16} />
          </button>
        </div>
        <Link to={`/listings/${l.id}`} className="line-clamp-1 font-semibold text-slate-800 dark:text-slate-100 hover:text-brand-700 dark:hover:text-brand-300">
          {l.title}
        </Link>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <MapPin size={12} /> <span className="line-clamp-1">{locationText(l)}</span>
        </p>
        <ListingSpecs l={l} className="mt-2 text-xs" />
      </div>
    </div>
  );
}

export default function Search() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<ListingPage | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const filters = readFilters(params);
  const view = params.get("view") === "map" ? "map" : "list";
  const page = Math.max(1, Number(params.get("page")) || 1);

  useEffect(() => {
    const qs = new URLSearchParams();
    FILTER_KEYS.forEach((k) => filters[k] && qs.set(k, filters[k]));
    if (view === "map") qs.set("limit", String(MAP_LIMIT));
    else {
      qs.set("limit", String(PAGE_SIZE));
      qs.set("page", String(page));
    }
    setError(false);
    setData(null);
    setSelected(null);
    api<ListingPage>(`/listings?${qs}`)
      .then(setData)
      .catch(() => setError(true));
  }, [params.toString(), reload]);

  const update = (changes: Record<string, string>, keepPage = false) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!keepPage) next.delete("page");
    setParams(next);
  };

  const applyFilters = (f: Filters) => {
    update(f);
    setDrawer(false);
  };

  const clearFilters = () => {
    const next: Record<string, string> = {};
    if (view === "map") next.view = "map";
    if (filters.sort) next.sort = filters.sort;
    setParams(next);
    setDrawer(false);
  };

  // Build granular chips for active filters
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.type) {
    chips.push({
      label: t(`type.${filters.type}`),
      onRemove: () => update({ type: "" }),
    });
  }

  if (filters.city && !filters.district) {
    chips.push({
      label: filters.city,
      onRemove: () => update({ city: "", district: "", neighborhood: "" }),
    });
  }

  if (filters.district) {
    const dList = filters.district.split(",").map((d) => d.trim()).filter(Boolean);
    dList.forEach((d) => {
      chips.push({
        label: d,
        onRemove: () => {
          const remaining = dList.filter((x) => x !== d);
          let remainingNeighborhoods = filters.neighborhood;
          if (filters.neighborhood && filters.city && remaining.length > 0) {
            const allowed = new Set(
              remaining.flatMap((dist) => locationData[filters.city]?.[dist] ?? [])
            );
            remainingNeighborhoods = filters.neighborhood
              .split(",")
              .map((n) => n.trim())
              .filter((n) => allowed.has(n))
              .join(",");
          }
          update({
            district: remaining.join(","),
            neighborhood: remainingNeighborhoods,
          });
        },
      });
    });
  }

  if (filters.neighborhood) {
    const nList = filters.neighborhood.split(",").map((n) => n.trim()).filter(Boolean);
    nList.forEach((n) => {
      chips.push({
        label: n,
        onRemove: () => {
          const remaining = nList.filter((x) => x !== n);
          update({ neighborhood: remaining.join(",") });
        },
      });
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    chips.push({
      label: `${filters.minPrice || "0"} – ${filters.maxPrice || "∞"} ₺`,
      onRemove: () => update({ minPrice: "", maxPrice: "" }),
    });
  }

  if (filters.minArea || filters.maxArea) {
    chips.push({
      label: `${filters.minArea || "0"} – ${filters.maxArea || "∞"} m²`,
      onRemove: () => update({ minArea: "", maxArea: "" }),
    });
  }

  if (filters.rooms) {
    const rList = filters.rooms.split(",").map((r) => r.trim()).filter(Boolean);
    rList.forEach((r) => {
      const preset = ROOM_PRESETS.find((p) => p.id === r);
      chips.push({
        label: preset ? preset.label : `${r} oda`,
        onRemove: () => {
          const remaining = rList.filter((x) => x !== r);
          update({ rooms: remaining.join(",") });
        },
      });
    });
  }

  const items = data?.items ?? [];
  const selectedListing = items.find((l) => l.id === selected);

  const heading = filters.district
    ? t("search.titleIn", { place: filters.district.split(",").join(", ") })
    : filters.city
    ? t("search.titleIn", { place: filters.city })
    : t("search.title");

  return (
    <div className="page py-6 lg:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{heading}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {data ? (view === "map" && data.total > MAP_LIMIT ? t("search.mapLimited", { n: MAP_LIMIT, total: data.total }) : t("home.resultCount", { n: data.total })) : " "}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <ArrowUpDown size={14} className="text-slate-400" />
            <select
              value={filters.sort || "newest"}
              onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none dark:text-slate-100 cursor-pointer"
              aria-label={t("sort.title")}
            >
              <option value="newest">{t("sort.newest")}</option>
              <option value="oldest">{t("sort.oldest")}</option>
              <option value="price_asc">{t("sort.priceAsc")}</option>
              <option value="price_desc">{t("sort.priceDesc")}</option>
            </select>
          </div>

          <button onClick={() => setDrawer(true)} className="btn-secondary lg:hidden">
            <SlidersHorizontal size={16} /> {t("filter.title")}
            {chips.length > 0 && <span className="rounded-full bg-brand-700 px-1.5 text-xs text-white">{chips.length}</span>}
          </button>

          <Segmented
            value={view}
            onChange={(v) => update({ view: v === "map" ? "map" : "" })}
            options={[
              {
                value: "list",
                label: (
                  <span className="flex items-center gap-1.5">
                    <LayoutGrid size={15} /> <span className="hidden sm:inline">{t("search.list")}</span>
                  </span>
                ),
              },
              {
                value: "map",
                label: (
                  <span className="flex items-center gap-1.5">
                    <MapIcon size={15} /> <span className="hidden sm:inline">{t("search.map")}</span>
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-5">
            <FilterPanel initial={filters} onApply={applyFilters} onClear={clearFilters} />
          </div>
        </aside>

        <section className="min-w-0">
          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-sm font-medium text-brand-800 ring-1 ring-inset ring-brand-100 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-800"
                >
                  {c.label}
                  <button onClick={c.onRemove} className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-800" aria-label="remove">
                    <X size={14} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline dark:text-slate-400 dark:hover:text-slate-100"
              >
                {t("filter.clearAll")}
              </button>
            </div>
          )}

          {error ? (
            <EmptyState
              icon={<SearchX size={22} />}
              title={t("common.loadError")}
              action={
                <button onClick={() => setReload((n) => n + 1)} className="btn-secondary">
                  {t("common.retry")}
                </button>
              }
            />
          ) : view === "map" ? (
            <div className="relative">
              <MapView
                className="h-[calc(100vh-15rem)] min-h-[460px]"
                markers={items.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, price: l.price }))}
                fitToMarkers
                activeId={selected ?? hovered}
                onHover={setHovered}
                onSelect={setSelected}
                onMapClick={() => setSelected(null)}
                selectedDistricts={filters.district}
                selectedNeighborhoods={filters.neighborhood}
              />
              {selectedListing && <MapPreview l={selectedListing} onClose={() => setSelected(null)} />}
              {data && items.length === 0 && (
                <div className="card absolute left-1/2 top-4 -translate-x-1/2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                  {t("home.emptyTitle")}
                </div>
              )}
            </div>
          ) : !data ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<SearchX size={22} />}
              title={t("home.emptyTitle")}
              text={t("home.emptyText")}
              action={
                chips.length > 0 && (
                  <button onClick={clearFilters} className="btn-secondary">
                    {t("filter.clear")}
                  </button>
                )
              }
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((l) => (
                  <ListingCard key={l.id} l={l} />
                ))}
              </div>
              {data.pages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-1">
                  <button
                    className="btn-secondary btn-sm h-9"
                    disabled={page <= 1}
                    onClick={() => update({ page: String(page - 1) }, true)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        update({ page: p > 1 ? String(p) : "" }, true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${
                        p === page
                          ? "bg-brand-700 text-white"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="btn-secondary btn-sm h-9"
                    disabled={page >= data.pages}
                    onClick={() => update({ page: String(page + 1) }, true)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>

      <Modal open={drawer} onClose={() => setDrawer(false)} title={t("filter.title")}>
        <div className="p-5">
          <FilterPanel initial={filters} onApply={applyFilters} onClear={clearFilters} />
        </div>
      </Modal>
    </div>
  );
}
