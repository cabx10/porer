import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, LayoutDashboard, LogOut, MessageCircle, Plus, Search, UserRound } from "lucide-react";
import { useAuth } from "../auth";
import { useLang, useT } from "../i18n";
import { ThemeToggle } from "../theme";

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
      {(["tr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-md px-2 py-1 uppercase transition ${lang === l ? "bg-white dark:bg-slate-900 text-brand-800 dark:text-brand-200 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function UserMenu() {
  const t = useT();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!user) return null;
  const item = "flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-slate-800">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 dark:bg-brand-900/60 text-sm font-bold text-brand-800 dark:text-brand-200">
          {user.name.charAt(0).toLocaleUpperCase("tr")}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 dark:text-slate-200 md:block">{user.name}</span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden py-1">
          <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
          <Link to="/dashboard" className={item}>
            <LayoutDashboard size={16} /> {t("nav.dashboard")}
          </Link>
          <Link to="/messages" className={item}>
            <MessageCircle size={16} /> {t("nav.messages")}
          </Link>
          <Link to="/profile" className={item}>
            <UserRound size={16} /> {t("nav.profile")}
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className={`${item} w-full border-t border-slate-100 dark:border-slate-800 text-red-600 hover:bg-red-50`}
          >
            <LogOut size={16} /> {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const t = useT();
  const { user } = useAuth();
  const navLink = ({ isActive }: { isActive: boolean }) =>
    `hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition sm:inline-flex ${
      isActive ? "text-brand-800 dark:text-brand-200" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="page flex h-16 items-center gap-3">
          <Link to="/" className="mr-auto flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white shadow-sm">
              <Building2 size={19} />
            </span>
            <span className="text-[15px] font-bold leading-tight text-slate-900 dark:text-white">
              Real Estate
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Rental</span>
            </span>
          </Link>

          <NavLink to="/search" className={navLink}>
            <Search size={16} /> {t("nav.search")}
          </NavLink>
          {user && (
            <NavLink to="/messages" className={navLink}>
              <MessageCircle size={16} /> {t("nav.messages")}
            </NavLink>
          )}
          <ThemeToggle />
          <LangSwitch />
          {user ? (
            <>
              <Link to="/listings/new" className="btn-primary px-3 sm:px-4">
                <Plus size={18} />
                <span className="hidden sm:inline">{t("nav.newListing")}</span>
              </Link>
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/listings/new" className="btn-ghost hidden md:inline-flex">
                <Plus size={16} /> {t("nav.newListing")}
              </Link>
              <Link to="/login" className="btn-secondary hidden sm:inline-flex">
                {t("nav.login")}
              </Link>
              <Link to="/register" className="btn-primary">
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-brand-950 text-brand-100">
        <div className="page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-white">
                <Building2 size={19} />
              </span>
              <span className="font-bold text-white">Real Estate Rental</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-200">{t("footer.about")}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{t("footer.explore")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/search?type=HOME" className="hover:text-white">
                  {t("footer.homes")}
                </Link>
              </li>
              <li>
                <Link to="/search?type=OFFICE" className="hover:text-white">
                  {t("footer.offices")}
                </Link>
              </li>
              <li>
                <Link to="/search?view=map" className="hover:text-white">
                  {t("footer.mapSearch")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">{t("footer.owners")}</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/listings/new" className="hover:text-white">
                  {t("nav.newListing")}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white">
                  {t("nav.dashboard")}
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-white">
                  {t("nav.messages")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="page flex flex-col items-center justify-between gap-2 py-5 text-xs text-brand-300 sm:flex-row">
            <span>© 2026 Real Estate Rental</span>
            <span>{t("footer.tagline")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
