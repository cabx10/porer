import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

interface Props {
  markers: { id: number; lat: number; lng: number; title?: string }[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  onSelect?: (id: number) => void;
  onMapClick?: (lat: number, lng: number) => void; // used when picking a location
}

export default function MapView({ markers, center, zoom = 11, height = 400, onSelect, onMapClick }: Props) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY });
  if (!isLoaded) return <div style={{ height }}>Loading map…</div>;
  const c = center ?? markers[0] ?? { lat: 41.0082, lng: 28.9784 }; // default: Istanbul
  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height }}
      center={c}
      zoom={zoom}
      onClick={(e) => e.latLng && onMapClick?.(e.latLng.lat(), e.latLng.lng())}
    >
      {markers.map((m) => (
        <Marker key={m.id} position={{ lat: m.lat, lng: m.lng }} title={m.title} onClick={() => onSelect?.(m.id)} />
      ))}
    </GoogleMap>
  );
}
