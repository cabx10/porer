import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, ImageOff, X } from "lucide-react";
import { useT } from "../i18n";

export default function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const count = photos.length;
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fullscreen, prev, next]);

  if (count === 0)
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <div className="flex flex-col items-center gap-2 text-sm">
          <ImageOff size={32} />
          {t("gallery.noPhotos")}
        </div>
      </div>
    );

  const arrow =
    "absolute top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:bg-white";

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-200">
        {/* Blurred copy fills the side bars of portrait photos. */}
        <img src={photos[index]} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover opacity-70 blur-2xl" />
        <img src={photos[index]} alt={title} className="relative h-full w-full cursor-zoom-in object-contain" onClick={() => setFullscreen(true)} />
        {count > 1 && (
          <>
            <button onClick={prev} className={`${arrow} left-3`} aria-label="previous">
              <ChevronLeft size={20} />
            </button>
            <button onClick={next} className={`${arrow} right-3`} aria-label="next">
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-white">
          {index + 1} / {count}
        </span>
        <button
          onClick={() => setFullscreen(true)}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow"
        >
          <Expand size={13} /> {t("gallery.fullscreen")}
        </button>
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={p}
              onClick={() => setIndex(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === index ? "ring-brand-600" : "opacity-70 ring-transparent hover:opacity-100"
              }`}
            >
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95" onClick={() => setFullscreen(false)}>
          <img src={photos[index]} alt={title} className="max-h-[90vh] max-w-[92vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="close"
          >
            <X size={22} />
          </button>
          {count > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className={`${arrow} left-4`}
                aria-label="previous"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className={`${arrow} right-4`}
                aria-label="next"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}
          <span className="absolute bottom-5 text-sm text-white/80">
            {index + 1} / {count}
          </span>
        </div>
      )}
    </div>
  );
}
