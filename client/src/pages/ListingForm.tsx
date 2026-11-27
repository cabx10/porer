import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ImagePlus, MapPin, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../api";
import { useAuth } from "../auth";
import { useT, formatPrice } from "../i18n";
import { Listing, ListingType } from "../types";
import LocationSelect, { LocationValue } from "../components/LocationSelect";
import MapView from "../components/MapView";
import { ListingSpecs, TypeBadge } from "../components/ListingCard";
import { Field, PageLoader, Segmented, Spinner } from "../components/ui";

const MAX_PHOTO_MB = 10;

interface FormState {
  type: ListingType;
  title: string;
  description: string;
  price: string;
  area: string;
  rooms: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  lat: number | null;
  lng: number | null;
}

const blank: FormState = {
  type: "HOME",
  title: "",
  description: "",
  price: "",
  area: "",
  rooms: "",
  city: "",
  district: "",
  neighborhood: "",
  address: "",
  lat: null,
  lng: null,
};

type Errors = Partial<Record<keyof FormState | "photos", string>>;

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="mb-8 flex items-center">
      {labels.map((l, i) => {
        const done = i < step;
        const current = i === step;
        return (
          <li key={l} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-brand-700 text-white"
                    : current
                    ? "border-2 border-brand-700 text-brand-700 dark:border-brand-400 dark:text-brand-400"
                    : "border border-slate-300 dark:border-slate-700 text-slate-400"
                }`}
              >
                {done ? <Check size={14} /> : i + 1}
              </span>
              <span className={`text-xs font-medium sm:text-sm ${current ? "font-semibold text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{l}</span>
            </div>
            {i < labels.length - 1 && <div className={`mx-3 h-0.5 flex-1 ${done ? "bg-brand-700" : "bg-slate-200 dark:bg-slate-800"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export default function ListingForm() {
  const t = useT();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const editing = Boolean(id);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Errors>({});
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) return;
    api<Listing>(`/listings/${id}`)
      .then((l) => {
        if (user && l.ownerId !== user.id) {
          toast.error(t("form.notYours"));
          navigate("/dashboard");
          return;
        }
        setForm({
          type: l.type,
          title: l.title,
          description: l.description,
          price: String(l.price),
          area: String(l.area),
          rooms: String(l.rooms),
          city: l.city,
          district: l.district ?? "",
          neighborhood: l.neighborhood ?? "",
          address: l.address,
          lat: l.lat,
          lng: l.lng,
        });
        setExistingPhotos(l.photos);
      })
      .catch(() => {
        toast.error(t("detail.notFound"));
        navigate("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [id, editing, user]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const mapCenter = useMemo<{ lat: number; lng: number }>(() => {
    if (form.lat !== null && form.lng !== null) return { lat: form.lat, lng: form.lng };
    return { lat: 37.0003, lng: 35.3213 }; // Default Adana
  }, [form.lat, form.lng]);

  const set = (k: keyof FormState, v: unknown) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onLocation = (v: LocationValue) => {
    setForm((f) => ({ ...f, city: v.city, district: v.district, neighborhood: v.neighborhood }));
    setErrors((e) => ({ ...e, city: undefined }));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const valid = incoming.filter((f) => f.type.startsWith("image/") && f.size <= MAX_PHOTO_MB * 1024 * 1024);
    if (valid.length < incoming.length) toast.error(t("form.photoRejected", { mb: MAX_PHOTO_MB }));
    setFiles((prev) => [...prev, ...valid]);
    setErrors((e) => ({ ...e, photos: undefined }));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const makeCover = (i: number) => setFiles((prev) => [prev[i], ...prev.filter((_, j) => j !== i)]);

  const validate = (s: number): boolean => {
    const e: Errors = {};
    const positive = (v: string) => v !== "" && Number(v) > 0;
    if (s === 0) {
      if (form.title.trim().length < 5) e.title = t("form.err.title");
      if (!positive(form.price)) e.price = t("form.err.price");
      if (!positive(form.area)) e.area = t("form.err.area");
      const parsedR = form.rooms.includes("+") ? Number(form.rooms.split("+")[0].trim()) : Number(form.rooms);
      if (form.rooms === "" || isNaN(parsedR) || parsedR < 0) e.rooms = t("form.err.rooms");
    }
    if (s === 1) {
      if (!form.city) e.city = t("form.err.city");
      if (form.lat === null) e.lat = t("form.err.location");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!validate(0) || !validate(1)) return;
    const parsedR = form.rooms.includes("+") ? form.rooms.split("+")[0].trim() : form.rooms;
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "rooms") body.append("rooms", parsedR);
      else body.append(k, v === null ? "" : String(v));
    });
    files.forEach((f) => body.append("photos", f));
    setSaving(true);
    try {
      const saved = await api<Listing>(editing ? `/listings/${id}` : "/listings", { method: editing ? "PUT" : "POST", body });
      toast.success(editing ? t("form.updated") : t("form.published"));
      navigate(`/listings/${saved.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const steps = [t("form.step.details"), t("form.step.location"), t("form.step.photos"), t("form.step.review")];
  const allPhotos = [...existingPhotos, ...previews];

  return (
    <div className="page max-w-3xl py-8">
      <Link to={editing ? `/listings/${id}` : "/dashboard"} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-brand-300">
        <ArrowLeft size={16} /> {t("common.back")}
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{editing ? t("form.editTitle") : t("form.newTitle")}</h1>

      <Stepper step={step} labels={steps} />

      <div className="card p-5 sm:p-7">
        {step === 0 && (
          <div className="space-y-5">
            <Field label={t("form.type")}>
              <Segmented
                className="w-full sm:w-80"
                value={form.type}
                onChange={(v) => set("type", v)}
                options={[
                  { value: "HOME", label: t("type.HOME") },
                  { value: "OFFICE", label: t("type.OFFICE") },
                ]}
              />
            </Field>
            <Field label={t("form.title")} error={errors.title} hint={t("form.titleHint")}>
              <input className={`input ${errors.title ? "input-error" : ""}`} value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label={t("form.description")} hint={t("form.descriptionPlaceholder")}>
              <textarea
                rows={4}
                className="input resize-y"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t("form.price")} error={errors.price}>
                <div className="relative">
                  <input type="number" min={0} className={`input pr-14 ${errors.price ? "input-error" : ""}`} value={form.price} onChange={(e) => set("price", e.target.value)} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₺{t("listing.perMonth")}</span>
                </div>
              </Field>
              <Field label={t("form.area")} error={errors.area}>
                <div className="relative">
                  <input type="number" min={0} className={`input pr-10 ${errors.area ? "input-error" : ""}`} value={form.area} onChange={(e) => set("area", e.target.value)} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">m²</span>
                </div>
              </Field>
              <Field label={t("form.rooms")} error={errors.rooms} hint={t("filter.roomInputHint")}>
                <input type="text" placeholder="Örn. 2+1 veya 2" className={`input ${errors.rooms ? "input-error" : ""}`} value={form.rooms} onChange={(e) => set("rooms", e.target.value)} />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Field label={t("form.region")} error={errors.city}>
              <LocationSelect value={form} onChange={onLocation} error={errors.city} />
            </Field>
            <Field label={t("form.address")}>
              <input className="input" placeholder={t("form.addressPlaceholder")} value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="label mb-0">{t("form.pin")}</span>
                {form.lat !== null && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <MapPin size={13} /> {t("form.pinSet")}
                  </span>
                )}
              </div>
              <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{t("form.pinHint")}</p>
              <MapView
                pickLocation
                className={`h-80 ${errors.lat ? "ring-2 ring-red-400" : ""}`}
                center={mapCenter}
                zoom={form.lat !== null ? 15 : 11}
                markers={form.lat !== null && form.lng !== null ? [{ id: 0, lat: form.lat, lng: form.lng }] : []}
                onMapClick={(lat, lng) => {
                  setForm((f) => ({ ...f, lat, lng }));
                  setErrors((e) => ({ ...e, lat: undefined }));
                }}
              />
              {errors.lat && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{errors.lat}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInput.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragging ? "border-brand-500 bg-brand-50 dark:bg-brand-900/40" : "border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                <ImagePlus size={22} />
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">{t("form.dropTitle")}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("form.dropHint", { mb: MAX_PHOTO_MB })}</p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {editing && existingPhotos.length > 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{t("form.existingPhotosNote")}</p>}

            {allPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {existingPhotos.map((p, i) => (
                  <div key={p} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <img src={p} alt="" className="h-full w-full object-cover" />
                    {i === 0 && <CoverTag />}
                  </div>
                ))}
                {previews.map((src, i) => (
                  <div key={src} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    {existingPhotos.length === 0 && i === 0 && <CoverTag />}
                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-slate-900/60 p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      {existingPhotos.length === 0 && i > 0 && (
                        <button type="button" onClick={() => makeCover(i)} title={t("form.makeCover")} className="rounded-lg bg-white/90 dark:bg-slate-900/90 p-1.5 text-slate-700 dark:text-slate-200 hover:bg-white">
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        title={t("form.removePhoto")}
                        className="rounded-lg bg-white/90 dark:bg-slate-900/90 p-1.5 text-red-600 hover:bg-white"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("form.reviewHint")}</p>
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800">
                {allPhotos[0] && <img src={allPhotos[0]} alt="" className="h-full w-full object-cover" />}
                <TypeBadge type={form.type} className="absolute left-3 top-3" />
              </div>
              <div className="space-y-2 p-5">
                <div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(Number(form.price), t.lang)}</span>
                  <span className="ml-1 text-slate-500 dark:text-slate-400">{t("listing.perMonth")}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{form.title}</h3>
                <p className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin size={14} /> {[form.neighborhood, form.district, form.city].filter(Boolean).join(", ")}
                </p>
                {(() => {
                  const parsedR = form.rooms.includes("+") ? Number(form.rooms.split("+")[0].trim()) : Number(form.rooms);
                  return <ListingSpecs l={{ area: Number(form.area), rooms: isNaN(parsedR) ? 0 : parsedR }} />;
                })()}
                {form.description && <p className="line-clamp-4 whitespace-pre-wrap pt-2 text-sm text-slate-600 dark:text-slate-300">{form.description}</p>}
                <p className="pt-1 text-xs text-slate-400">{t("form.photoCount", { n: allPhotos.length })}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-5">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-ghost">
              <ArrowLeft size={16} /> {t("common.back")}
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button type="button" onClick={next} className="btn-primary">
              {t("common.continue")} <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={saving} className="btn-primary">
              {saving ? <Spinner className="h-4 w-4" /> : <Check size={16} />}
              {editing ? t("form.saveChanges") : t("form.publish")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CoverTag() {
  const t = useT();
  return <span className="absolute left-2 top-2 rounded-full bg-brand-700 px-2 py-0.5 text-[11px] font-semibold text-white">{t("form.cover")}</span>;
}
