import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

interface Props {
  markers: { id: number; lat: number; lng: number; title?: string; price?: number }[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number;
  onSelect?: (id: number) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

import { useEffect, useState } from "react";
export default function MapView({ markers, center, zoom = 11, height = 400, onSelect, onMapClick }: Props) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "" });
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [center, map]);

  if (!isLoaded) return <div style={{ height }}>Loading map...</div>;
  const c = center ?? markers[0] ?? { lat: 37.0000, lng: 35.3213 }; // default: Adana
  
  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height }}
      center={c}
      zoom={zoom}
      onClick={(e) => e.latLng && onMapClick?.(e.latLng.lat(), e.latLng.lng())}
      onLoad={setMap}
    >
      {markers.map((m) => (
        <Marker 
          key={m.id} 
          position={{ lat: m.lat, lng: m.lng }} 
          title={m.title} 
          label={m.price ? { text: m.price.toLocaleString() + " ₺", fontSize: "14px", fontWeight: "bold", color: "#b00" } : undefined}
          onClick={() => onSelect?.(m.id)} 
        />
      ))}
    </GoogleMap>
  );
}