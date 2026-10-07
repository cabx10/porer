import { useEffect, useState } from "react";
import { api } from "../api";
import MapView from "../components/MapView";
import { Listing, User } from "../types";

const empty = { minPrice: "", maxPrice: "", minArea: "", maxArea: "", rooms: "", city: "", type: "" };

export default function Listings({ user }: { user: User | null }) {
  const [filters, setFilters] = useState(empty);
  const [items, setItems] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState("");

  const search = async () => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    const res = await api<{ items: Listing[] }>(`/listings?${qs}`);
    setItems(res.items);
  };
  useEffect(() => { search(); }, []);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters({ ...filters, [k]: e.target.value });

  const requestViewing = async () => {
    if (!selected) return;
    try {
      await api("/appointments", { method: "POST", body: { listingId: selected.id, date, message: msg } });
      alert("Appointment request sent!");
      setDate(""); setMsg("");
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          <select value={filters.type} onChange={set("type")}>
            <option value="">Home & Office</option><option value="HOME">Home</option><option value="OFFICE">Office</option>
          </select>
          <input placeholder="City" value={filters.city} onChange={set("city")} />
          <input placeholder="Min price" type="number" value={filters.minPrice} onChange={set("minPrice")} />
          <input placeholder="Max price" type="number" value={filters.maxPrice} onChange={set("maxPrice")} />
          <input placeholder="Min m²" type="number" value={filters.minArea} onChange={set("minArea")} />
          <input placeholder="Max m²" type="number" value={filters.maxArea} onChange={set("maxArea")} />
          <input placeholder="Rooms" type="number" value={filters.rooms} onChange={set("rooms")} />
          <button onClick={search}>Search</button>
          <button onClick={() => { setFilters(empty); setTimeout(search, 0); }}>Reset</button>
        </div>

        {items.map((l) => (
          <div key={l.id} onClick={() => setSelected(l)}
            style={{ border: "1px solid #ccc", padding: 10, marginBottom: 8, cursor: "pointer",
              background: selected?.id === l.id ? "#eef6ff" : "white" }}>
            <b>{l.title}</b> <small>({l.type})</small>
            <div>{l.price.toLocaleString()} ₺/mo · {l.area} m² · {l.rooms} rooms</div>
            <small>{l.address}, {l.city}</small>
          </div>
        ))}
        {!items.length && <p>No listings match your filters.</p>}
      </div>

      <div>
        <MapView markers={items} center={selected ?? undefined} zoom={selected ? 15 : 11}
          onSelect={(id) => setSelected(items.find((i) => i.id === id) ?? null)} />
        {selected && (
          <div style={{ marginTop: 12 }}>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            {user?.role === "SEEKER" ? (
              <div style={{ display: "grid", gap: 6, maxWidth: 320 }}>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
                <input placeholder="Message (optional)" value={msg} onChange={(e) => setMsg(e.target.value)} />
                <button onClick={requestViewing} disabled={!date}>Request viewing</button>
              </div>
            ) : (
              <small>{user ? "Owners can't request viewings." : "Log in as a seeker to request a viewing."}</small>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
