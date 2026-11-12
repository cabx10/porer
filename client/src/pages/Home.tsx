import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, CalendarCheck, Home as HomeIcon, KeyRound, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { api } from "../api";
import { Listing, ListingPage, ListingType } from "../types";
import { useT, formatPrice } from "../i18n";
import { locationText } from "../lib/format";
import { locationData } from "../utils/locations";
import ListingCard, { ListingCardSkeleton } from "../components/ListingCard";

const CITY = "Adana";

/** Simple skyline drawn behind the hero text. */
function Skyline() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-white/[0.06]" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden>
      <path
        fill="currentColor"
        d="M0 160V96h40V60h30v36h20V40h50v56h24V70h36v26h30V20h44v76h22V56h40v40h26V76h30v20h40V30h48v66h20V64h34v32h30V48h40v48h24V84h36V44h52v52h22V70h30v26h40V36h44v60h26V62h36v34h30V24h46v72h24V58h38v38h30V80h34v16h40V50h46v46h22V72h32v24h36v64z"
      />
    </svg>
  );
}

function HeroSearch() {
  const t = useT();
  const navigate = useNavigate();
  const [type, setType] = useState<ListingType | "">("");
  const [district, setDistrict] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (type) qs.set("type", type);
    qs.set("city", CITY);
    if (district) qs.set("district", district);
    if (maxPrice) qs.set("maxPrice", maxPrice);
    navigate(`/search?${qs}`);
  };

  const field = "flex flex-1 flex-col rounded-xl px-4 py-2.5 text-left transition hover:bg-slate-50 focus-within:bg-slate-50";
  const label = "text-[11px] font-semibold uppercase tracking-wider text-slate-500";
  const control = "w-full bg-transparent text-[15px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400";

  return (
    <form onSubmit={submit} className="flex flex-col gap-1 rounded-2xl bg-white p-2 shadow-2xl shadow-brand-950/30 md:flex-row md:items-center">
      <label className={field}>
        <span className={label}>{t("hero.type")}</span>
        <select className={control} value={type} onChange={(e) => setType(e.target.value as ListingType | "")}>
          <option value="">{t("type.ALL")}</option>
          <option value="HOME">{t("type.HOME")}</option>
          <option value="OFFICE">{t("type.OFFICE")}</option>
        </select>
      </label>
      <span className="hidden h-10 w-px bg-slate-200 md:block" />
      <label className={field}>
        <span className={label}>{t("hero.where")}</span>
        <select className={control} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">{t("hero.allOf", { city: CITY })}</option>
          {Object.keys(locationData[CITY]).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <span className="hidden h-10 w-px bg-slate-200 md:block" />
      <label className={field}>
        <span className={label}>{t("hero.budget")}</span>
        <input className={control} type="number" min={0} placeholder={t("hero.budgetPlaceholder")} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      </label>
      <button className="btn-primary h-14 rounded-xl px-7 text-base md:ml-1">
        <Search size={19} /> {t("filter.search")}
      </button>
    </form>
  );
}

/** Right side of the hero: the newest listing's photo with floating info cards. */
function HeroVisual({ l }: { l: Listing }) {
  const t = useT();
  return (
    <Link to={`/listings/${l.id}`} className="relative block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl shadow-brand-950/50 ring-1 ring-white/10">
        <img src={l.photos[0]} alt={l.title} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent p-5 pt-16">
          <p className="line-clamp-1 font-semibold text-white">{l.title}</p>
          <p className="mt-0.5 line-clamp-1 text-sm text-white/75">{locationText(l)}</p>
        </div>
      </div>
      <div className="absolute -left-10 top-10 rounded-2xl bg-white px-4 py-3 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t("hero.newest")}</p>
        <p className="text-xl font-bold text-slate-900">
          {formatPrice(l.price, t.lang)}
          <span className="text-sm font-normal text-slate-500"> {t("listing.perMonth")}</span>
        </p>
      </div>
      <div className="absolute -right-6 bottom-24 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-xl">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CalendarCheck size={18} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{t("hero.viewingCard")}</p>
          <p className="text-xs text-slate-500">{t("hero.viewingCardSub")}</p>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ title, subtitle, link }: { title: string; subtitle?: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-500">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link.to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">
          {link.label} <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const t = useT();
  const [latest, setLatest] = useState<Listing[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [districtCounts, setDistrictCounts] = useState<Record<string, number>>({});
  const districts = Object.keys(locationData[CITY]);

  useEffect(() => {
    api<ListingPage>("/listings?limit=6")
      .then((d) => {
        setLatest(d.items);
        setTotal(d.total);
      })
      .catch(() => setLatest([]));
    Promise.all(
      districts.map((d) =>
        api<ListingPage>(`/listings?limit=1&city=${encodeURIComponent(CITY)}&district=${encodeURIComponent(d)}`)
          .then((r) => [d, r.total] as const)
          .catch(() => [d, 0] as const),
      ),
    ).then((pairs) => setDistrictCounts(Object.fromEntries(pairs)));
  }, []);

  const steps = [
    { icon: Search, title: t("how.1.title"), text: t("how.1.text") },
    { icon: CalendarCheck, title: t("how.2.title"), text: t("how.2.text") },
    { icon: KeyRound, title: t("how.3.title"), text: t("how.3.text") },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-brand-900">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(90,128,196,0.45),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(13,24,48,0.9),transparent_60%)]" />
        <Skyline />
        <div className="page relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <div>
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100 ring-1 ring-inset ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {total !== null ? t("hero.badge", { n: total, city: CITY }) : t("hero.badgeLoading", { city: CITY })}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">{t("hero.title")}</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-100">{t("hero.subtitle")}</p>
          </div>
          <div className="mt-10">
            <HeroSearch />
          </div>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-brand-100">
            {[
              [ShieldCheck, t("hero.point1")],
              [CalendarCheck, t("hero.point2")],
              [MessageCircle, t("hero.point3")],
            ].map(([Icon, text]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <span key={text as string} className="inline-flex items-center gap-2">
                  <I size={17} className="text-brand-300" /> {text as string}
                </span>
              );
            })}
          </div>
          </div>
          {latest?.[0]?.photos[0] && (
            <div className="hidden px-8 lg:block">
              <HeroVisual l={latest[0]} />
            </div>
          )}
        </div>
      </section>

      <section className="page py-16 sm:py-20">
        <SectionHeader title={t("home.latest")} subtitle={t("home.latestSub")} link={{ to: "/search", label: t("home.viewAll") }} />
        {latest === null ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : latest.length === 0 ? (
          <div className="card flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-slate-600">{t("home.noListingsYet")}</p>
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

      <section className="border-y border-slate-200 bg-white">
        <div className="page py-16 sm:py-20">
          <SectionHeader title={t("home.districts", { city: CITY })} subtitle={t("home.districtsSub")} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {districts.map((d, i) => (
              <Link
                key={d}
                to={`/search?city=${encodeURIComponent(CITY)}&district=${encodeURIComponent(d)}`}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
              >
                <div
                  className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-60 transition group-hover:scale-125 ${
                    ["bg-brand-100", "bg-sky-100", "bg-indigo-100", "bg-slate-100", "bg-blue-100", "bg-cyan-100"][i % 6]
                  }`}
                />
                <Building2 size={22} className="relative text-brand-700" />
                <p className="relative mt-6 text-lg font-semibold text-slate-900">{d}</p>
                <p className="relative text-sm text-slate-500">
                  {districtCounts[d] === undefined ? "…" : t("home.listingCount", { n: districtCounts[d] })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page py-16 sm:py-20">
        <SectionHeader title={t("how.title")} subtitle={t("how.subtitle")} />
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card relative p-6">
              <span className="absolute right-5 top-4 text-5xl font-bold text-slate-100">{i + 1}</span>
              <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-brand-700 text-white">
                <Icon size={22} />
              </span>
              <h3 className="relative mt-5 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="relative mt-2 leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-800 px-6 py-12 sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-600/40 blur-2xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-xl">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white">
                <HomeIcon size={22} />
              </span>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("cta.title")}</h2>
              <p className="mt-2 text-brand-100">{t("cta.text")}</p>
            </div>
            <Link to="/listings/new" className="btn h-12 shrink-0 bg-white px-6 text-base text-brand-800 hover:bg-brand-50">
              {t("cta.button")} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
