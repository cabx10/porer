import { Link } from "react-router-dom";
import { BedDouble, ImageOff, MapPin, Maximize2 } from "lucide-react";
import { Listing } from "../types";
import { useT, formatPrice } from "../i18n";
import { coverPhoto, locationText } from "../lib/format";

export function TypeBadge({ type, className = "" }: { type: Listing["type"]; className?: string }) {
  const t = useT();
  return (
    <span className={`inline-flex items-center rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-brand-800 shadow-sm ${className}`}>
      {t(`type.${type}`)}
    </span>
  );
}

export function ListingSpecs({ l, className = "" }: { l: Pick<Listing, "area" | "rooms">; className?: string }) {
  const t = useT();
  return (
    <div className={`flex items-center gap-4 text-sm text-slate-600 ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <Maximize2 size={15} className="text-slate-400" />
        {l.area} m²
      </span>
      <span className="inline-flex items-center gap-1.5">
        <BedDouble size={15} className="text-slate-400" />
        {t("listing.roomsCount", { n: l.rooms })}
      </span>
    </div>
  );
}

export default function ListingCard({
  l,
  active,
  onHover,
}: {
  l: Listing;
  active?: boolean;
  onHover?: (id: number | null) => void;
}) {
  const t = useT();
  const photo = coverPhoto(l);
  return (
    <Link
      to={`/listings/${l.id}`}
      onMouseEnter={() => onHover?.(l.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`group card block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg ${active ? "ring-2 ring-brand-500" : ""}`}
    >
      <div className="relative aspect-[4/3] bg-slate-100">
        {photo ? (
          <img src={photo} alt={l.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-slate-400">
            <ImageOff size={28} />
          </div>
        )}
        <TypeBadge type={l.type} className="absolute left-3 top-3" />
        {l.photos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/60 px-2 py-0.5 text-xs font-medium text-white">
            {l.photos.length} {t("listing.photosShort")}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-slate-900">{formatPrice(l.price, t.lang)}</span>
          <span className="text-sm text-slate-500">{t("listing.perMonth")}</span>
        </div>
        <h3 className="line-clamp-1 font-semibold text-slate-800 group-hover:text-brand-700">{l.title}</h3>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin size={14} className="shrink-0" />
          <span className="line-clamp-1">{locationText(l)}</span>
        </p>
        <ListingSpecs l={l} className="border-t border-slate-100 pt-3" />
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
