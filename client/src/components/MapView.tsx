import { useEffect, useState } from "react";
import { GoogleMap, Marker, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import { MapPinOff } from "lucide-react";
import { useT, formatPriceShort } from "../i18n";

export interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  price?: number;
}

interface Props {
  markers: MapMarker[];
  /** Pan here when it changes (e.g. after picking a district). */
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  activeId?: number | null;
  onSelect?: (id: number) => void;
  onHover?: (id: number | null) => void;
  onMapClick?: (lat: number, lng: number) => void;
  /** Show a crosshair cursor: the map is used to pick a location. */
  pickLocation?: boolean;
  /** Zoom the map to show every marker whenever the marker list changes. */
  fitToMarkers?: boolean;
}

const ADANA = { lat: 37.0, lng: 35.3213 };

const mapOptions: google.maps.MapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
  // Hide shops, restaurants and transit icons so the listing pins stand out.
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

export default function MapView({
  markers,
  center,
  zoom = 12,
  className = "h-80",
  activeId,
  onSelect,
  onHover,
  onMapClick,
  fitToMarkers,
  pickLocation,
}: Props) {
  const t = useT();
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "" });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [initialCenter] = useState(() => center ?? markers[0] ?? ADANA);

  useEffect(() => {
    if (map && center) map.panTo(center);
  }, [map, center?.lat, center?.lng]);

  const markerKey = markers.map((m) => m.id).join(",");
  useEffect(() => {
    if (!map || !fitToMarkers || markers.length === 0) return;
    if (markers.length === 1) {
      map.panTo(markers[0]);
      map.setZoom(13);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((m) => bounds.extend(m));
    map.fitBounds(bounds, 60);
  }, [map, fitToMarkers, markerKey]);

  if (loadError)
    return (
      <div className={`grid place-items-center rounded-2xl bg-slate-100 text-sm text-slate-500 ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <MapPinOff size={22} />
          {t("map.error")}
        </div>
      </div>
    );
  if (!isLoaded) return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;

  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={initialCenter}
        zoom={zoom}
        options={{ ...mapOptions, draggableCursor: pickLocation ? "crosshair" : undefined }}
        onLoad={setMap}
        onClick={(e) => e.latLng && onMapClick?.(e.latLng.lat(), e.latLng.lng())}
      >
        {markers.map((m) =>
          m.price !== undefined ? (
            <OverlayView
              key={m.id}
              position={m}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h - 4 })}
            >
              <button
                type="button"
                // Keep pin clicks from also reaching the map's own click handler.
                ref={(el) => el && google.maps.OverlayView.preventMapHitsAndGesturesFrom(el)}
                onClick={() => onSelect?.(m.id)}
                onMouseEnter={() => onHover?.(m.id)}
                onMouseLeave={() => onHover?.(null)}
                className={`relative whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold shadow-md ring-1 transition ${
                  activeId === m.id
                    ? "z-10 scale-110 bg-brand-700 text-white ring-brand-800"
                    : "bg-white text-slate-900 ring-slate-200 hover:bg-brand-50"
                }`}
              >
                {formatPriceShort(m.price, t.lang)}
              </button>
            </OverlayView>
          ) : (
            <Marker key={m.id} position={m} />
          ),
        )}
      </GoogleMap>
    </div>
  );
}
