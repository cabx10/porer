import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, LayoutDashboard, LogOut, MessageCircle, Plus, Search, UserRound } from "lucide-react";
import { useAuth } from "../auth";
import { useLang, useT } from "../i18n";

function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
      {(["tr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-md px-2 py-1 uppercase transition ${lang === l ? "bg-white text-brand-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
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
  const item = "flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-slate-100">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
          {user.name.charAt(0).toLocaleUpperCase("tr")}
        </span>
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-700 md:block">{user.name}</span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden py-1">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
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
            className={`${item} w-full border-t border-slate-100 text-red-600 hover:bg-red-50`}
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
      isActive ? "text-brand-800" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="page flex h-16 items-center gap-3">
          <Link to="/" className="mr-auto flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white shadow-sm">
              <Building2 size={19} />
            </span>
            <span className="text-[15px] font-bold leading-tight text-slate-900">
              Real Estate
              <span className="block text-xs font-medium text-slate-500">Rental</span>
            </span>
          </Link>

          <NavLink to="/" end className={navLink}>
            <Search size={16} /> {t("nav.search")}
          </NavLink>
          {user && (
            <NavLink to="/messages" className={navLink}>
              <MessageCircle size={16} /> {t("nav.messages")}
            </NavLink>
          )}
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
              <Link to="/login" className="btn-ghost hidden sm:inline-flex">
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

      <footer className="border-t border-slate-200 bg-white">
        <div className="page flex flex-col items-center justify-between gap-2 py-6 text-xs text-slate-500 sm:flex-row">
          <span>© 2026 Real Estate Rental</span>
          <span>{t("footer.tagline")}</span>
        </div>
      </footer>
    </div>
  );
}
