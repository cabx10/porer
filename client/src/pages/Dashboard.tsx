import { useEffect, useState } from "react";
import { api } from "../api";
import MapView from "../components/MapView";
import { Appointment, Listing, User } from "../types";

const blank = { title: "", description: "", type: "HOME", price: "", area: "", rooms: "", city: "", address: "", lat: 0, lng: 0 };

export default function Dashboard({ user }: { user: User }) {
  return user.role === "OWNER" ? <Owner /> : <Seeker />;
}

function Owner() {
  const [form, setForm] = useState(blank);
  const [mine, setMine] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<Appointment[]>([]);

  const load = async () => {
    setMine(await api<Listing[]>("/listings/mine"));
    setRequests(await api<Appointment[]>("/appointments/incoming"));
  };
  useEffect(() => { load(); }, []);

  const f = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!form.lat) return alert("Click the map to set the property location");
    try { await api("/listings", { method: "POST", body: form }); setForm(blank); load(); }
    catch (e) { alert((e as Error).message); }
  };
  const decide = async (id: number, status: string) => { await api(`/appointments/${id}`, { method: "PATCH", body: { status } }); load(); };
  const remove = async (id: number) => { await api(`/listings/${id}`, { method: "DELETE" }); load(); };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <h3>Add listing</h3>
        <div style={{ display: "grid", gap: 6 }}>
          <input placeholder="Title" value={form.title} onChange={f("title")} />
          <textarea placeholder="Description" value={form.description} onChange={f("description")} />
          <select value={form.type} onChange={f("type")}><option value="HOME">Home</option><option value="OFFICE">Office</option></select>
          <input placeholder="Monthly price" type="number" value={form.price} onChange={f("price")} />
          <input placeholder="Area (m²)" type="number" value={form.area} onChange={f("area")} />
          <input placeholder="Rooms" type="number" value={form.rooms} onChange={f("rooms")} />
          <input placeholder="City" value={form.city} onChange={f("city")} />
          <input placeholder="Address" value={form.address} onChange={f("address")} />
          <small>Click the map to set location {form.lat ? `(${form.lat.toFixed(4)}, ${form.lng.toFixed(4)})` : ""}</small>
          <MapView height={260} markers={form.lat ? [{ id: 0, lat: form.lat, lng: form.lng }] : []}
            onMapClick={(lat, lng) => setForm({ ...form, lat, lng })} />
          <button onClick={submit}>Publish</button>
        </div>

        <h3>My listings</h3>
        {mine.map((l) => (
          <div key={l.id} style={{ borderBottom: "1px solid #ddd", padding: 6 }}>
            {l.title} — {l.price} ₺ <button onClick={() => remove(l.id)}>Delete</button>
          </div>
        ))}
      </div>

      <div>
        <h3>Viewing requests</h3>
        {requests.map((r) => (
          <div key={r.id} style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
            <b>{r.listing.title}</b> · {new Date(r.date).toLocaleString()}
            <div>{r.seeker?.name} ({r.seeker?.email})</div>
            {r.message && <i>"{r.message}"</i>}
            <div>Status: {r.status}</div>
            {r.status === "PENDING" && (
              <>
                <button onClick={() => decide(r.id, "APPROVED")}>Approve</button>{" "}
                <button onClick={() => decide(r.id, "REJECTED")}>Reject</button>
              </>
            )}
          </div>
        ))}
        {!requests.length && <p>No requests yet.</p>}
      </div>
    </div>
  );
}

function Seeker() {
  const [items, setItems] = useState<Appointment[]>([]);
  useEffect(() => { api<Appointment[]>("/appointments/mine").then(setItems); }, []);
  return (
    <div>
      <h3>My viewing requests</h3>
      {items.map((a) => (
        <div key={a.id} style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
          <b>{a.listing.title}</b> — {a.listing.address}
          <div>{new Date(a.date).toLocaleString()} · <b>{a.status}</b></div>
        </div>
      ))}
      {!items.length && <p>No requests yet.</p>}
    </div>
  );
}
