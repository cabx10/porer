import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import MapView from "../components/MapView";
import { locationData } from "../utils/locations";
import { Listing, User } from "../types";

const empty = { minPrice: "", maxPrice: "", minArea: "", maxArea: "", rooms: "", city: "", district: "", neighborhood: "", type: "" };

export default function Listings({ user }: { user: User | null }) {
  const [filters, setFilters] = useState(empty);
  const [items, setItems] = useState<Listing[]>([]);
  const navigate = useNavigate();
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | undefined>(undefined);

  const geocodeLocation = (searchString: string) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchString + ", Turkey" }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        setMapCenter({ lat: location.lat(), lng: location.lng() });
      }
    });
  };

  const search = async () => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    const res = await api<{ items: Listing[] }>(`/listings?${qs}`);
    setItems(res.items);
  };
  useEffect(() => { search(); }, []);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters({ ...filters, [k]: e.target.value });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ height: "calc(100vh - 100px)", overflowY: "auto", paddingRight: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <select value={filters.type} onChange={set("type")}>
            <option value="">Home & Office</option><option value="HOME">Home</option><option value="OFFICE">Office</option>
          </select>
          
          <select value={filters.city} onChange={e => {
            const city = e.target.value;
            setFilters({ ...filters, city, district: "", neighborhood: "" });
            if (city) geocodeLocation(city);
          }}>
            <option value="">All Cities</option>
            {Object.keys(locationData).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.district} onChange={e => {
            const district = e.target.value;
            setFilters({ ...filters, district, neighborhood: "" });
            if (district) geocodeLocation(`${district}, ${filters.city}`);
          }} disabled={!filters.city}>
            <option value="">All Districts</option>
            {filters.city && locationData[filters.city] && Object.keys(locationData[filters.city]).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filters.neighborhood} onChange={e => {
            const neighborhood = e.target.value;
            setFilters({ ...filters, neighborhood });
            if (neighborhood) geocodeLocation(`${neighborhood}, ${filters.district}, ${filters.city}`);
          }} disabled={!filters.district}>
            <option value="">All Neighborhoods</option>
            {filters.city && filters.district && locationData[filters.city][filters.district] && locationData[filters.city][filters.district].map((n: string) => <option key={n} value={n}>{n}</option>)}
          </select>

          <input placeholder="Min price" type="number" value={filters.minPrice} onChange={set("minPrice")} style={{ width: 100 }} />
          <input placeholder="Max price" type="number" value={filters.maxPrice} onChange={set("maxPrice")} style={{ width: 100 }} />
          <input placeholder="Min m²" type="number" value={filters.minArea} onChange={set("minArea")} style={{ width: 80 }} />
          <input placeholder="Max m²" type="number" value={filters.maxArea} onChange={set("maxArea")} style={{ width: 80 }} />
          <input placeholder="Rooms" type="number" value={filters.rooms} onChange={set("rooms")} style={{ width: 80 }} />
          <button onClick={search}>Search</button>
          <button onClick={() => { setFilters(empty); setTimeout(search, 0); }}>Reset</button>
        </div>

        {items.map((l) => (
          <div key={l.id} onClick={() => navigate(`/listings/${l.id}`)}
            style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8, cursor: "pointer",
              background: "white", display: "flex", gap: 12 }}>
            {l.photos && l.photos.length > 0 ? (
              <img src={"http://localhost:4000" + l.photos[0]} alt="Cover" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 4 }} />
            ) : (
              <div style={{ width: 100, height: 100, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>No photo</div>
            )}
            <div>
              <b style={{ color: "#0066cc", fontSize: 18 }}>{l.title}</b> <small>({l.type})</small>
              <div style={{ fontSize: 16, fontWeight: "bold", marginTop: 4 }}>{l.price.toLocaleString()} ₺</div>
              <div style={{ color: "#666" }}>{l.area} m² · {l.rooms} rooms</div>
              <small>{l.address}, {l.city}</small>
            </div>
          </div>
        ))}
        {!items.length && <p>No listings match your filters.</p>}
      </div>

      <div style={{ position: "sticky", top: 0 }}>
        <MapView markers={items} center={mapCenter} zoom={mapCenter ? 13 : 11} height={window.innerHeight - 100}
          onSelect={(id) => navigate(`/listings/${id}`)} />
      </div>
    </div>
  );
}