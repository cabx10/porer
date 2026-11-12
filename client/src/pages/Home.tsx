import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, CalendarCheck, Home as HomeIcon, MessageCircle, Search, Store } from "lucide-react";
import { api } from "../api";
import { Listing, ListingPage, ListingType } from "../types";
import { useT } from "../i18n";
import { locationData } from "../utils/locations";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";

const CITY = "Adana";
const ROOM_OPTIONS = ["1", "2", "3", "4", "5"];

/** Konut / İşyeri tabs over one search bar; the third field depends on the tab. */
function HeroSearch() {
  const t = useT();
  const navigate = useNavigate();
  const [type, setType] = useState<ListingType>("HOME");
  const [district, setDistrict] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rooms, setRooms] = useState("");
  const [minArea, setMinArea] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams({ type, city: CITY });
    if (district) qs.set("district", district);
    if (maxPrice) qs.set("maxPrice", maxPrice);
    if (type === "HOME" && rooms) qs.set("rooms", rooms);
    if (type === "OFFICE" && minArea) qs.set("minArea", minArea);
    navigate(`/search?${qs}`);
  };

  const field = "flex flex-1 flex-col rounded-xl px-4 py-2.5 text-left transition hover:bg-slate-50 focus-within:bg-slate-50 dark:hover:bg-slate-800 dark:focus-within:bg-slate-800";
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
      <form onSubmit={submit} className="flex flex-col gap-1 rounded-b-2xl rounded-tr-2xl bg-white p-2 shadow-2xl shadow-brand-950/30 dark:bg-slate-900 md:flex-row md:items-center">
        <label className={field}>
          <span className={label}>{t("hero.district")}</span>
          <select className={control} value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">{t("hero.allOf", { city: CITY })}</option>
            {Object.keys(locationData[CITY]).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        {divider}
        <label className={field}>
          <span className={label}>{t("hero.maxRent")}</span>
          <input className={control} type="number" min={0} placeholder={t("hero.any")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </label>
        {divider}
        {type === "HOME" ? (
          <label className={field}>
            <span className={label}>{t("filter.rooms")}</span>
            <select className={control} value={rooms} onChange={(e) => setRooms(e.target.value)}>
              <option value="">{t("hero.any")}</option>
              {ROOM_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {t("listing.roomsCount", { n: r })}
                </option>
              ))}
            </select>
          </label>
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
  const [counts, setCounts] = useState<{ all?: number; HOME?: number; OFFICE?: number; districts: Record<string, number> }>({ districts: {} });
  const districts = Object.keys(locationData[CITY]);

  useEffect(() => {
    api<ListingPage>("/listings?limit=6")
      .then((d) => setLatest(d.items))
      .catch(() => setLatest([]));
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
      <section className="relative overflow-hidden bg-brand-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(90,128,196,0.35),transparent_55%)]" />
        <div className="page relative py-14 sm:py-20">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{t("hero.title", { city: CITY })}</h1>
          <p className="mt-3 text-base text-brand-200 sm:text-lg">
            {counts.all !== undefined ? t("hero.stats", { n: counts.all, d: districts.length }) : " "}
          </p>
          <div className="mt-8 max-w-4xl">
            <HeroSearch />
          </div>
        </div>
      </section>

      <section className="page -mt-px py-12">
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
