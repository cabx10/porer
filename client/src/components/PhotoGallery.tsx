import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grid3x3, ImageOff, X } from "lucide-react";
import { useT } from "../i18n";

/** Full-screen photo viewer with keyboard navigation and a thumbnail strip. */
export function Lightbox({ photos, start, title, onClose }: { photos: string[]; start: number; title: string; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const count = photos.length;
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const arrow = "absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20";
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm text-white/70">
          {index + 1} / {count}
        </span>
        <span className="hidden max-w-md truncate text-sm font-medium sm:block">{title}</span>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="close">
          <X size={22} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
        <img src={photos[index]} alt={title} className="max-h-full max-w-full rounded-lg object-contain" />
        {count > 1 && (
          <>
            <button onClick={prev} className={`${arrow} left-4`} aria-label="previous">
              <ChevronLeft size={24} />
            </button>
            <button onClick={next} className={`${arrow} right-4`} aria-label="next">
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4">
          {photos.map((p, i) => (
            <button
              key={p}
              onClick={() => setIndex(i)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 transition ${i === index ? "ring-white" : "opacity-50 ring-transparent hover:opacity-90"}`}
            >
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Airbnb-style mosaic on wide screens, swipeable single photo on phones. */
export default function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const t = useT();
  const [open, setOpen] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const count = photos.length;

  if (count === 0)
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400 md:aspect-[21/9]">
        <div className="flex flex-col items-center gap-2 text-sm">
          <ImageOff size={32} />
          {t("gallery.noPhotos")}
        </div>
      </div>
    );

  const tile = (i: number, className = "") => (
    <button key={photos[i]} onClick={() => setOpen(i)} className={`group relative overflow-hidden bg-slate-100 ${className}`}>
      <img src={photos[i]} alt={i === 0 ? title : ""} className="h-full w-full object-cover transition duration-300 group-hover:scale-105 group-hover:brightness-90" />
    </button>
  );

  const small = photos.slice(1, 5).map((_, k) => k + 1);

  return (
    <>
      {/* Phones: one photo with arrows */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 md:hidden">
        <img src={photos[mobileIndex]} alt={title} className="h-full w-full object-cover" onClick={() => setOpen(mobileIndex)} />
        {count > 1 && (
          <>
            <button
              onClick={() => setMobileIndex((i) => (i - 1 + count) % count)}
              className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"
              aria-label="previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setMobileIndex((i) => (i + 1) % count)}
              className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow"
              aria-label="next"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-white">
              {mobileIndex + 1} / {count}
            </span>
          </>
        )}
      </div>

      {/* Tablets and up: mosaic */}
      <div className="relative hidden md:block">
        {count === 1 ? (
          <div className="grid h-[440px] overflow-hidden rounded-2xl">{tile(0)}</div>
        ) : (
          // 2 photos: side by side. 3: big + 2 stacked. 4: big + 1 tall + 2 stacked. 5+: big + 2x2.
          <div className={`grid h-[440px] gap-2 overflow-hidden rounded-2xl ${count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3 grid-rows-2" : "grid-cols-4 grid-rows-2"}`}>
            {tile(0, count === 2 ? "" : "col-span-2 row-span-2")}
            {small.map((i) => tile(i, count === 4 && i === 1 ? "row-span-2" : ""))}
          </div>
        )}
        <button
          onClick={() => setOpen(0)}
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-slate-900/10 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 shadow-md transition hover:bg-slate-50"
        >
          <Grid3x3 size={16} /> {t("gallery.showAll", { n: count })}
        </button>
      </div>

      {open !== null && <Lightbox photos={photos} start={open} title={title} onClose={() => setOpen(null)} />}
    </>
  );
}
