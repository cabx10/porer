import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../auth";
import { useT } from "../i18n";
import { User } from "../types";
import { isValidPhone } from "../lib/validate";
import { Field, Spinner } from "../components/ui";

export default function Profile() {
  const t = useT();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (name.trim().length < 2) err.name = t("auth.err.name");
    if (!isValidPhone(phone)) err.phone = t("auth.err.phone");
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    try {
      const res = await api<{ user: User }>("/auth/profile", { method: "PUT", body: { name: name.trim(), phone: phone.trim() } });
      updateUser(res.user);
      toast.success(t("profile.saved"));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page max-w-xl py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("nav.profile")}</h1>
      <p className="mb-6 mt-1 text-slate-500">{t("profile.subtitle")}</p>
      <form onSubmit={submit} className="card space-y-5 p-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-800">
            {user?.name.charAt(0).toLocaleUpperCase("tr")}
          </span>
          <div>
            <p className="font-semibold text-slate-900">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>
        <Field label={t("auth.name")} error={errors.name}>
          <input className={`input ${errors.name ? "input-error" : ""}`} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label={t("auth.email")} hint={t("profile.emailHint")}>
          <input className="input" value={user?.email ?? ""} disabled />
        </Field>
        <Field label={t("auth.phone")} error={errors.phone} hint={t("auth.phoneHint")}>
          <input className={`input ${errors.phone ? "input-error" : ""}`} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" />
        </Field>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={saving}>
            {saving && <Spinner className="h-4 w-4" />} {t("profile.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
