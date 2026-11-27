import { Fragment, useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, OverlayView, Polygon, useJsApiLoader } from "@react-google-maps/api";
import { MapPinOff } from "lucide-react";
import { useT, formatPriceShort } from "../i18n";
import { useTheme } from "../theme";
import { adanaDistrictsGeo } from "../utils/adanaDistrictsGeo";
import { adanaNeighborhoodsGeo, NeighborhoodGeoItem } from "../utils/adanaNeighborhoodsGeo";
import { api } from "../api";

export interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  price?: number;
}

export type NeighborhoodGeo = NeighborhoodGeoItem;

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
  /** Let the mouse wheel scroll the page; zooming then needs Ctrl + wheel. */
  cooperative?: boolean;
  /** Zoom the map to show every marker whenever the marker list changes. */
  fitToMarkers?: boolean;
  /** Districts to outline in red (array or comma-separated string). */
  selectedDistricts?: string[] | string;
  /** Neighborhoods to outline in green (array or comma-separated string). */
  selectedNeighborhoods?: string[] | string;
}

const ADANA = { lat: 37.0, lng: 35.3213 };

const mapOptions: google.maps.MapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  clickableIcons: false,
  gestureHandling: "greedy",
};

// Hide shops, restaurants and transit icons so the listing pins stand out.
const baseStyles: google.maps.MapTypeStyle[] = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

// Navy-tinted night palette matching the site's dark theme.
const darkStyles: google.maps.MapTypeStyle[] = [
  ...baseStyles,
  { elementType: "geometry", stylers: [{ color: "#16213a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ea2c4" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1830" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2d3d5c" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1a2742" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#26365a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#16213a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#33477a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9bb0d3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1426" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4b6290" }] },
];

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
  cooperative,
  selectedDistricts,
  selectedNeighborhoods,
}: Props) {
  const t = useT();
  const { theme } = useTheme();
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "" });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [initialCenter] = useState(() => center ?? markers[0] ?? ADANA);

  // Parse districts into list
  const districtList = useMemo(() => {
    if (!selectedDistricts) return [];
    const arr = Array.isArray(selectedDistricts) ? selectedDistricts : selectedDistricts.split(",");
    return arr.map((d) => d.trim()).filter(Boolean);
  }, [selectedDistricts]);

  // Extract polygon paths for each selected district
  const districtPolygons = useMemo(() => {
    const list: Array<{ district: string; paths: Array<{ lat: number; lng: number }> }> = [];
    districtList.forEach((d) => {
      const geo = adanaDistrictsGeo[d];
      if (geo) {
        geo.forEach((path) => {
          list.push({ district: d, paths: path });
        });
      }
    });
    return list;
  }, [districtList]);

  // Parse neighborhoods into list
  const neighborhoodList = useMemo(() => {
    if (!selectedNeighborhoods) return [];
    const arr = Array.isArray(selectedNeighborhoods) ? selectedNeighborhoods : selectedNeighborhoods.split(",");
    return arr.map((n) => n.trim()).filter(Boolean);
  }, [selectedNeighborhoods]);

  // State for dynamically fetched neighborhood polygons from server
  const [fetchedNeighborhoodGeos, setFetchedNeighborhoodGeos] = useState<NeighborhoodGeo[]>([]);

  useEffect(() => {
    if (neighborhoodList.length === 0) {
      setFetchedNeighborhoodGeos([]);
      return;
    }

    // Filter to neighborhoods not already available in pre-bundled client geo
    const missing = neighborhoodList.filter((name) => !adanaNeighborhoodsGeo[name]);
    if (missing.length === 0) {
      setFetchedNeighborhoodGeos([]);
      return;
    }

    const primaryDistrict = districtList.length === 1 ? districtList[0] : "";
    const qs = new URLSearchParams({
      names: missing.join(","),
    });
    if (primaryDistrict) qs.set("district", primaryDistrict);

    let isMounted = true;
    api<NeighborhoodGeo[]>(`/geo/neighborhoods?${qs}`)
      .then((res) => {
        if (isMounted) setFetchedNeighborhoodGeos(res);
      })
      .catch((err) => {
        console.error("Failed to load neighborhood boundaries:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [neighborhoodList.join(","), districtList.join(",")]);

  // Merge pre-bundled and dynamically fetched neighborhood geos
  const neighborhoodGeos = useMemo(() => {
    const list: NeighborhoodGeo[] = [];
    const seen = new Set<string>();

    neighborhoodList.forEach((name) => {
      const bundled = adanaNeighborhoodsGeo[name];
      if (bundled) {
        list.push(bundled);
        seen.add(name.toLowerCase());
      }
    });

    fetchedNeighborhoodGeos.forEach((geo) => {
      if (!seen.has(geo.name.toLowerCase())) {
        list.push(geo);
        seen.add(geo.name.toLowerCase());
      }
    });

    return list;
  }, [neighborhoodList, fetchedNeighborhoodGeos]);

  useEffect(() => {
    if (map && center) map.panTo(center);
  }, [map, center?.lat, center?.lng]);

  // Auto-fit camera to highlighted regions or markers
  const markerKey = markers.map((m) => m.id).join(",");
  const districtKey = districtList.join(",");
  const neighborhoodKey = neighborhoodList.join(",");

  useEffect(() => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Prioritize zooming to selected neighborhoods (green)
    if (neighborhoodGeos.length > 0) {
      neighborhoodGeos.forEach((ng) => {
        ng.paths.forEach((ring) => {
          ring.forEach((pt) => {
            bounds.extend(pt);
            hasPoints = true;
          });
        });
        if (ng.center) {
          bounds.extend(ng.center);
          hasPoints = true;
        }
      });
    } else if (districtPolygons.length > 0) {
      // Prioritize zooming to selected districts (red)
      districtPolygons.forEach((dp) => {
        dp.paths.forEach((pt) => {
          bounds.extend(pt);
          hasPoints = true;
        });
      });
    } else if (fitToMarkers && markers.length > 0) {
      if (markers.length === 1) {
        map.panTo(markers[0]);
        map.setZoom(13);
        return;
      }
      markers.forEach((m) => {
        bounds.extend(m);
        hasPoints = true;
      });
    }

    if (hasPoints) {
      map.fitBounds(bounds, 50);
      const listener = google.maps.event.addListenerOnce(map, "idle", () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }
      });
      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [map, districtKey, neighborhoodKey, neighborhoodGeos, districtPolygons, markerKey, fitToMarkers]);

  if (loadError)
    return (
      <div className={`grid place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <MapPinOff size={22} />
          {t("map.error")}
        </div>
      </div>
    );
  if (!isLoaded) return <div className={`animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 ${className}`} />;

  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={initialCenter}
        zoom={zoom}
        options={{ ...mapOptions, styles: theme === "dark" ? darkStyles : baseStyles, backgroundColor: theme === "dark" ? "#16213a" : "#e8eaed", gestureHandling: cooperative ? "cooperative" : "greedy", draggableCursor: pickLocation ? "crosshair" : undefined }}
        onLoad={setMap}
        onClick={(e) => e.latLng && onMapClick?.(e.latLng.lat(), e.latLng.lng())}
      >
        {/* Red Outlines for Selected Districts */}
        {districtPolygons.map((dp, idx) => (
          <Polygon
            key={`district-poly-${dp.district}-${idx}`}
            paths={dp.paths}
            options={{
              strokeColor: "#ef4444",
              strokeOpacity: 0.85,
              strokeWeight: 2.5,
              fillColor: "#ef4444",
              fillOpacity: 0.12,
              clickable: false,
            }}
          />
        ))}

        {/* Green Outlines for Selected Neighborhoods */}
        {neighborhoodGeos.map((ng, idx) => (
          <Fragment key={`ng-group-${ng.name}-${idx}`}>
            {ng.paths.map((path, pIdx) => (
              <Polygon
                key={`ng-poly-${ng.name}-${idx}-${pIdx}`}
                paths={path}
                options={{
                  strokeColor: "#10b981",
                  strokeOpacity: 0.95,
                  strokeWeight: 3,
                  fillColor: "#10b981",
                  fillOpacity: 0.22,
                  clickable: false,
                }}
              />
            ))}
            {ng.center && (
              <OverlayView
                position={ng.center}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}
              >
                <div className="pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-bold text-white shadow-md ring-1 ring-emerald-700/60 backdrop-blur-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
                  {ng.name}
                </div>
              </OverlayView>
            )}
          </Fragment>
        ))}

        {/* Listing markers */}
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
                    : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white ring-slate-200 dark:ring-slate-700 hover:bg-brand-50 dark:hover:bg-brand-900/40"
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
