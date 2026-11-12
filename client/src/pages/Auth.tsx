import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Building2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../auth";
import { useT } from "../i18n";
import { User } from "../types";
import { isValidEmail, isValidPhone } from "../lib/validate";
import { Field, Spinner } from "../components/ui";

type Mode = "login" | "register";
type Errors = Partial<Record<"name" | "email" | "password" | "phone", string>>;

export default function Auth({ mode }: { mode: Mode }) {
  const t = useT();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setF({ ...f, [k]: e.target.value });
    setErrors({ ...errors, [k]: undefined });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: Errors = {};
    if (!isValidEmail(f.email)) err.email = t("auth.err.email");
    if (mode === "register") {
      if (f.name.trim().length < 2) err.name = t("auth.err.name");
      if (f.password.length < 6) err.password = t("auth.err.password");
      if (!isValidPhone(f.phone)) err.phone = t("auth.err.phone");
    } else if (!f.password) err.password = t("auth.err.passwordRequired");
    setErrors(err);
    if (Object.keys(err).length) return;

    setBusy(true);
    try {
      const body = mode === "login" ? { email: f.email.trim(), password: f.password } : { ...f, name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim() };
      const res = await api<{ token: string; user: User }>(`/auth/${mode}`, { method: "POST", body });
      signIn(res.token, res.user);
      toast.success(mode === "login" ? t("auth.welcomeBack", { name: res.user.name }) : t("auth.welcome", { name: res.user.name }));
      navigate(from, { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const isLogin = mode === "login";
  return (
    <div className="page grid min-h-[calc(100vh-10rem)] place-items-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-700 text-white shadow">
            <Building2 size={24} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{isLogin ? t("auth.loginTitle") : t("auth.registerTitle")}</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">{isLogin ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}</p>
        </div>
        <form onSubmit={submit} noValidate className="card space-y-4 p-6">
          {!isLogin && (
            <Field label={t("auth.name")} error={errors.name}>
              <input className={`input ${errors.name ? "input-error" : ""}`} autoComplete="name" value={f.name} onChange={set("name")} />
            </Field>
          )}
          <Field label={t("auth.email")} error={errors.email}>
            <input className={`input ${errors.email ? "input-error" : ""}`} type="email" autoComplete="email" value={f.email} onChange={set("email")} />
          </Field>
          {!isLogin && (
            <Field label={t("auth.phone")} error={errors.phone} hint={t("auth.phoneHint")}>
              <input className={`input ${errors.phone ? "input-error" : ""}`} type="tel" autoComplete="tel" placeholder="05XX XXX XX XX" value={f.phone} onChange={set("phone")} />
            </Field>
          )}
          <Field label={t("auth.password")} error={errors.password} hint={!isLogin ? t("auth.passwordHint") : undefined}>
            <div className="relative">
              <input
                className={`input pr-10 ${errors.password ? "input-error" : ""}`}
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={f.password}
                onChange={set("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={t("auth.togglePassword")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <button className="btn-primary w-full py-3" disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />}
            {isLogin ? t("nav.login") : t("auth.createAccount")}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
          {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <Link to={isLogin ? "/register" : "/login"} state={location.state} className="font-semibold text-brand-700 dark:text-brand-300 hover:underline">
            {isLogin ? t("nav.register") : t("nav.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
