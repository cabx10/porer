import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, CalendarCheck, Check, ChevronDown, Home as HomeIcon, Map as MapIcon, MessageCircle, Search, Store } from "lucide-react";
import { api } from "../api";
import { Listing, ListingPage, ListingType } from "../types";
import { useT } from "../i18n";
import { locationData } from "../utils/locations";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";
import MapView, { MapMarker } from "../components/MapView";

const CITY = "Adana";
const ROOM_PRESETS = [
  { id: "0", label: "1+0" },
  { id: "1", label: "1+1" },
  { id: "2", label: "2+1" },
  { id: "3", label: "3+1" },
  { id: "4", label: "4+1" },
  { id: "5+", label: "5+" },
];

/** Konut / İşyeri tabs over one search bar; supports multi-district and multi-room options. */
function HeroSearch() {
  const t = useT();
  const navigate = useNavigate();
  const [type, setType] = useState<ListingType>("HOME");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [minRooms, setMinRooms] = useState("");
  const [minArea, setMinArea] = useState("");

  const [districtOpen, setDistrictOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const districtRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (districtRef.current && !districtRef.current.contains(e.target as Node)) {
        setDistrictOpen(false);
      }
      if (roomsRef.current && !roomsRef.current.contains(e.target as Node)) {
        setRoomsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDistrict = (d: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const toggleRoomPreset = (id: string) => {
    setSelectedRooms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearRooms = () => {
    setSelectedRooms([]);
    setMinRooms("");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams({ type, city: CITY });
    if (selectedDistricts.length > 0) qs.set("district", selectedDistricts.join(","));
    if (maxPrice) qs.set("maxPrice", maxPrice);
    if (type === "HOME") {
      if (selectedRooms.length > 0) qs.set("rooms", selectedRooms.join(","));
      if (minRooms) qs.set("minRooms", minRooms);
    }
    if (type === "OFFICE" && minArea) qs.set("minArea", minArea);
    navigate(`/search?${qs}`);
  };

  const roomSummary = () => {
    const parts: string[] = [];
    if (selectedRooms.length > 0) {
      const labels = selectedRooms.map((r) => ROOM_PRESETS.find((p) => p.id === r)?.label ?? r);
      parts.push(labels.join(", "));
    }
    if (minRooms) {
      parts.push(t("filter.minRoomsCount", { n: minRooms }));
    }
    return parts.length > 0 ? parts.join(" · ") : t("hero.any");
  };

  const allDistricts = Object.keys(locationData[CITY] ?? {});

  const field = "flex flex-1 flex-col rounded-xl px-4 py-2.5 text-left transition hover:bg-slate-50 focus-within:bg-slate-50 dark:hover:bg-slate-800 dark:focus-within:bg-slate-800 w-full";
  const label = "text-xs font-medium text-slate-500 dark:text-slate-400";
  const control = "w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500";
  const divider = <span className="hidden h-10 w-px bg-slate-200 dark:bg-slate-700 md:block" />;

  return (
    <div>
      <div className="flex gap-1">
        {(
          [
            ["HOME", HomeIcon, t("type.HOME")],
            ["OFFICE", Building2, t("type.OFFICE")],
          ] as const
        ).map(([value, Icon, text]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`inline-flex items-center gap-2 rounded-t-xl px-5 py-2.5 text-sm font-semibold transition ${
              type === value ? "bg-white text-brand-800 dark:bg-slate-900 dark:text-white" : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Icon size={16} /> {text}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="relative z-30 flex flex-col gap-1 rounded-b-2xl rounded-tr-2xl bg-white p-2 shadow-2xl shadow-brand-950/30 dark:bg-slate-900 md:flex-row md:items-center">
        {/* Multi-district field */}
        <div ref={districtRef} className={`relative flex-1 ${districtOpen ? "z-50" : "z-10"}`}>
          <button
            type="button"
            onClick={() => {
              setDistrictOpen((prev) => !prev);
              setRoomsOpen(false);
            }}
            className={field}
          >
            <span className={label}>{t("hero.district")}</span>
            <span className="flex items-center justify-between gap-1 w-full text-left">
              <span className={`truncate text-[15px] font-medium ${selectedDistricts.length > 0 ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                {selectedDistricts.length === 0
                  ? t("hero.allOf", { city: CITY })
                  : selectedDistricts.length === 1
                  ? selectedDistricts[0]
                  : t("filter.selectedDistricts", { n: selectedDistricts.length })}
              </span>
              <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${districtOpen ? "rotate-180" : ""}`} />
            </span>
          </button>

          {districtOpen && (
            <div className="absolute top-full left-0 z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t("filter.districtSelect")}
                </span>
                {selectedDistricts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDistricts([])}
                    className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
                  >
                    {t("filter.allDistricts")}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-2.5">
                {allDistricts.map((d) => {
                  const isSelected = selectedDistricts.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDistrict(d)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                        isSelected
                          ? "bg-brand-700 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <span className="truncate">{d}</span>
                      {isSelected && <Check size={13} className="shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
              {selectedDistricts.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[180px]">{selectedDistricts.join(", ")}</span>
                  <button
                    type="button"
                    onClick={() => setDistrictOpen(false)}
                    className="btn-secondary btn-sm py-0.5 px-2 text-xs font-semibold"
                  >
                    {t("common.continue")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {divider}

        {/* Max price */}
        <label className={field}>
          <span className={label}>{t("hero.maxRent")}</span>
          <input className={control} type="number" min={0} placeholder={t("hero.any")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </label>

        {divider}

        {/* Room presets + min rooms (for HOME) or Min area (for OFFICE) */}
        {type === "HOME" ? (
          <div ref={roomsRef} className={`relative flex-1 ${roomsOpen ? "z-50" : "z-10"}`}>
            <button
              type="button"
              onClick={() => {
                setRoomsOpen((prev) => !prev);
                setDistrictOpen(false);
              }}
              className={field}
            >
              <span className={label}>{t("filter.rooms")}</span>
              <span className="flex items-center justify-between gap-1 w-full text-left">
                <span className={`truncate text-[15px] font-medium ${(selectedRooms.length > 0 || minRooms) ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>
                  {roomSummary()}
                </span>
                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${roomsOpen ? "rotate-180" : ""}`} />
              </span>
            </button>

            {roomsOpen && (
              <div className="absolute top-full left-0 md:left-auto md:right-0 z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {t("filter.roomPresets")}
                  </span>
                  {(selectedRooms.length > 0 || minRooms) && (
                    <button
                      type="button"
                      onClick={clearRooms}
                      className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-400"
                    >
                      {t("filter.reset")}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2.5">
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
                            : "border-slate-200 bg-white text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t("filter.minRooms")}
                  </label>
                  <select
                    className="input h-9 py-1 text-xs"
                    value={minRooms}
                    onChange={(e) => setMinRooms(e.target.value)}
                  >
                    <option value="">{t("filter.anyRooms")}</option>
                    <option value="1">{t("filter.minRoomsCount", { n: 1 })}</option>
                    <option value="2">{t("filter.minRoomsCount", { n: 2 })}</option>
                    <option value="3">{t("filter.minRoomsCount", { n: 3 })}</option>
                    <option value="4">{t("filter.minRoomsCount", { n: 4 })}</option>
                    <option value="5">{t("filter.minRoomsCount", { n: 5 })}</option>
                  </select>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setRoomsOpen(false)}
                    className="btn-secondary btn-sm py-1 px-3 text-xs font-semibold"
                  >
                    {t("common.continue")}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <label className={field}>
            <span className={label}>{t("hero.minArea")}</span>
            <input className={control} type="number" min={0} placeholder={t("hero.any")} value={minArea} onChange={(e) => setMinArea(e.target.value)} />
          </label>
        )}
        <button className="btn-primary h-14 rounded-xl px-8 text-base md:ml-1">
          <Search size={19} /> {t("filter.search")}
        </button>
      </form>
    </div>
  );
}

/** Live map of the listings in the hero; pins open the listing. */
function HeroMap({ markers }: { markers: MapMarker[] }) {
  const t = useT();
  const navigate = useNavigate();
  return (
    <div className="relative hidden rounded-3xl bg-white/5 p-2 ring-1 ring-white/10 lg:block">
      <MapView className="h-[380px]" markers={markers} fitToMarkers cooperative zoom={11} onSelect={(id) => navigate(`/listings/${id}`)} />
      <Link
        to="/search?view=map"
        className="absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      >
        <MapIcon size={16} /> {t("hero.openMap")}
      </Link>
    </div>
  );
}

function SectionHeader({ title, link }: { title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{title}</h2>
      {link && (
        <Link to={link.to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200">
          {link.label} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

const count = (qs: string) =>
  api<ListingPage>(`/listings?limit=1&${qs}`)
    .then((r) => r.total)
    .catch(() => 0);

export default function Home() {
  const t = useT();
  const [latest, setLatest] = useState<Listing[] | null>(null);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [counts, setCounts] = useState<{ all?: number; HOME?: number; OFFICE?: number; districts: Record<string, number> }>({ districts: {} });
  const districts = Object.keys(locationData[CITY]);

  useEffect(() => {
    api<ListingPage>("/listings?limit=6")
      .then((d) => setLatest(d.items))
      .catch(() => setLatest([]));
    api<ListingPage>("/listings?limit=50")
      .then((d) => setMapMarkers(d.items.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, price: l.price }))))
      .catch(() => {});
    const city = `city=${encodeURIComponent(CITY)}`;
    Promise.all([
      count(""),
      count("type=HOME"),
      count("type=OFFICE"),
      ...districts.map((d) => count(`${city}&district=${encodeURIComponent(d)}`)),
    ]).then(([all, home, office, ...perDistrict]) =>
      setCounts({ all, HOME: home, OFFICE: office, districts: Object.fromEntries(districts.map((d, i) => [d, perDistrict[i]])) }),
    );
  }, []);

  const categories = [
    { type: "HOME" as const, icon: HomeIcon, title: t("cat.HOME.title"), text: t("cat.HOME.text") },
    { type: "OFFICE" as const, icon: Store, title: t("cat.OFFICE.title"), text: t("cat.OFFICE.text") },
  ];

  const steps = [
    { icon: Search, title: t("how.1.title"), text: t("how.1.text") },
    { icon: CalendarCheck, title: t("how.2.title"), text: t("how.2.text") },
    { icon: MessageCircle, title: t("how.3.title"), text: t("how.3.text") },
  ];

  return (
    <>
      <section className="relative z-20 bg-brand-900">
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,rgba(90,128,196,0.35),transparent_55%)]" />
        <div className="page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div>
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl xl:text-5xl">{t("hero.title", { city: CITY })}</h1>
            <p className="mt-3 text-base text-brand-200 sm:text-lg">
              {counts.all !== undefined ? t("hero.stats", { n: counts.all, d: districts.length }) : " "}
            </p>
            <div className="relative z-30 mt-8">
              <HeroSearch />
            </div>
          </div>
          <HeroMap markers={mapMarkers} />
        </div>
      </section>

      <section className="page relative z-10 -mt-px py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map(({ type, icon: Icon, title, text }) => (
            <Link
              key={type}
              to={`/search?type=${type}`}
              className="card group flex items-center gap-5 p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg dark:hover:border-brand-700"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{counts[type] ?? "–"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("cat.listings")}</p>
              </div>
              <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-slate-600" />
            </Link>
          ))}
        </div>
      </section>

      <section className="page pb-16">
        <SectionHeader title={t("home.latest")} link={{ to: "/search", label: t("home.viewAll") }} />
        {latest === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : latest.length === 0 ? (
          <div className="card flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-slate-600 dark:text-slate-300">{t("home.noListingsYet")}</p>
            <Link to="/listings/new" className="btn-primary">
              {t("nav.newListing")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="page py-14">
          <SectionHeader title={t("home.districts")} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {districts.map((d) => (
              <Link
                key={d}
                to={`/search?city=${encodeURIComponent(CITY)}&district=${encodeURIComponent(d)}`}
                className="rounded-xl border border-slate-200 px-4 py-3.5 transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-800 dark:hover:border-brand-700 dark:hover:bg-brand-900/20"
              >
                <p className="font-semibold text-slate-900 dark:text-white">{d}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {counts.districts[d] === undefined ? "…" : t("home.listingCount", { n: counts.districts[d] })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page py-16">
        <SectionHeader title={t("how.title")} />
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                <Icon size={20} />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="page pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand-800 px-6 py-10 sm:px-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-white sm:text-2xl">{t("cta.title")}</h2>
            <p className="mt-2 text-brand-100">{t("cta.text")}</p>
          </div>
          <Link to="/listings/new" className="btn h-12 shrink-0 bg-white px-6 text-base text-brand-800 hover:bg-brand-50">
            {t("cta.button")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
