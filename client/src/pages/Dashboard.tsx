import { useEffect, useState, useRef } from "react";
import { api } from "../api";
import MapView from "../components/MapView";
import { locationData } from "../utils/locations";
import { Appointment, Listing, User } from "../types";

const blank = { title: "", description: "", type: "HOME", price: "", area: "", rooms: "", city: "", district: "", neighborhood: "", address: "", lat: 0, lng: 0 };

export default function Dashboard({ user: _user }: { user: User }) {
  const [tab, setTab] = useState<"listings" | "requests">("listings");
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mine, setMine] = useState<Listing[]>([]);
  const [incoming, setIncoming] = useState<Appointment[]>([]);
  const [myRequests, setMyRequests] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState<{lat: number, lng: number} | undefined>(undefined);

  const loadData = async () => {
    try {
      const [mineRes, incomingRes, myRequestsRes] = await Promise.all([
        api<Listing[]>("/listings/mine"),
        api<Appointment[]>("/appointments/incoming"),
        api<Appointment[]>("/appointments/mine"),
      ]);
      setMine(mineRes);
      setIncoming(incomingRes);
      setMyRequests(myRequestsRes);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const f = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });


  const geocodeLocation = (searchString: string) => {
    if (!window.google || !window.google.maps) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchString + ", Turkey" }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        setMapCenter({ lat, lng });
        setForm(prev => ({ ...prev, lat, lng }));
      }
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setForm(prev => ({ ...prev, city, district: "", neighborhood: "" }));
    if (city) geocodeLocation(city);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setForm(prev => ({ ...prev, district, neighborhood: "" }));
    if (district) geocodeLocation(`${district}, ${form.city}`);
  };

  const handleNeighborhoodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const neighborhood = e.target.value;
    setForm(prev => ({ ...prev, neighborhood }));
    if (neighborhood) geocodeLocation(`${neighborhood}, ${form.district}, ${form.city}`);
  };

  const submitListing = async () => {
    if (!form.lat) return alert("Click the map to set the property location");
    
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append("photos", files[i]);
      }
    }

    try {
      const token = localStorage.getItem("token");
      const url = editId ? `http://localhost:4000/api/listings/${editId}` : "http://localhost:4000/api/listings";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Authorization": "Bearer " + token },
        body: formData
      });
      if (!res.ok) throw new Error(await res.text());
      
      setForm(blank);
      setFiles([]);
      setEditId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadData();
      alert(editId ? "Listing updated successfully!" : "Listing published successfully!");
    } catch (e) { alert((e as Error).message); }
  };

  const startEdit = (l: Listing) => {
    setEditId(l.id);
    setForm({
      title: l.title,
      description: l.description,
      type: l.type,
      price: String(l.price),
      area: String(l.area),
      rooms: String(l.rooms),
      city: l.city,
      district: l.district || "",
      neighborhood: l.neighborhood || "",
      address: l.address,
      lat: l.lat,
      lng: l.lng
    });
    setFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const decide = async (id: number, status: string) => {
    try {
      await api(`/appointments/${id}`, { method: "PATCH", body: { status } });
      loadData();
    } catch (e) { alert((e as Error).message); }
  };

  const removeListing = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await api(`/listings/${id}`, { method: "DELETE" });
      loadData();
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, borderBottom: "1px solid #ccc", paddingBottom: 10 }}>
        <button
          style={{ fontWeight: tab === "listings" ? "bold" : "normal", padding: "8px 16px", background: tab === "listings" ? "#0066cc" : "#f0f0f0", color: tab === "listings" ? "#fff" : "#333", border: "none", borderRadius: 4, cursor: "pointer" }}
          onClick={() => setTab("listings")}
        >
          🏠 My Properties & Incoming Requests ({mine.length} listings / {incoming.length} requests)
        </button>
        <button
          style={{ fontWeight: tab === "requests" ? "bold" : "normal", padding: "8px 16px", background: tab === "requests" ? "#0066cc" : "#f0f0f0", color: tab === "requests" ? "#fff" : "#333", border: "none", borderRadius: 4, cursor: "pointer" }}
          onClick={() => setTab("requests")}
        >
          📅 My Rental Viewing Requests ({myRequests.length})
        </button>
      </div>

      {loading ? <p>Loading dashboard...</p> : tab === "listings" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <h3>{editId ? "Edit Listing" : "Add Property to Rent Out"}</h3>
            <div style={{ display: "grid", gap: 6 }}>
              <input placeholder="Title" value={form.title} onChange={f("title")} />
              <textarea placeholder="Description" value={form.description} onChange={f("description")} />
              <select value={form.type} onChange={f("type")}>
                <option value="HOME">Home</option>
                <option value="OFFICE">Office</option>
              </select>
              <input placeholder="Monthly price (₺)" type="number" value={form.price} onChange={f("price")} />
              <input placeholder="Area (m²)" type="number" value={form.area} onChange={f("area")} />
              <input placeholder="Rooms" type="number" value={form.rooms} onChange={f("rooms")} />
              
              <select value={form.city} onChange={handleCityChange}>
                <option value="">Select City</option>
                {Object.keys(locationData).map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={form.district} onChange={handleDistrictChange} disabled={!form.city}>
                <option value="">Select District</option>
                {form.city && locationData[form.city] && Object.keys(locationData[form.city]).map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select value={form.neighborhood} onChange={handleNeighborhoodChange} disabled={!form.district}>
                <option value="">Select Neighborhood</option>
                {form.city && form.district && locationData[form.city][form.district] && locationData[form.city][form.district].map((n: string) => <option key={n} value={n}>{n}</option>)}
              </select>

              <input placeholder="Detailed Address (Optional)" value={form.address} onChange={f("address")} />
              
              <div style={{ border: "1px dashed #ccc", padding: 8, margin: "8px 0" }}>
                <label>Photos:</label>
                <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={(e) => {
                  // Copy the files now: clearing the input below empties e.target.files
                  // before React runs the setFiles updater.
                  const picked = Array.from(e.target.files ?? []);
                  setFiles(prev => [...prev, ...picked]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }} />
              </div>
              
              {files.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {files.map((file, idx) => (
                    <div key={idx} style={{ position: "relative", width: 60, height: 60 }}>
                      <img src={URL.createObjectURL(file)} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 4 }} />
                      <button 
                        onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                        style={{ position: "absolute", top: -5, right: -5, background: "red", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, padding: 0 }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}


              <small>Click the map to set location {form.lat ? `(${form.lat.toFixed(4)}, ${form.lng.toFixed(4)})` : ""}</small>
              <MapView height={260} center={mapCenter} markers={form.lat ? [{ id: 0, lat: form.lat, lng: form.lng }] : []} onMapClick={(lat, lng) => setForm(prev => ({ ...prev, lat, lng }))} />
              
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={submitListing} style={{ flex: 1 }}>{editId ? "Update Listing" : "Publish Listing"}</button>
                {editId && <button onClick={() => { setEditId(null); setForm(blank); setFiles([]); }} style={{ flex: 1, background: "#ccc", color: "#333", border: "none", borderRadius: 4, cursor: "pointer" }}>Cancel</button>}
              </div>
            </div>

            <h3 style={{ marginTop: 24 }}>My Published Listings</h3>
            {mine.map((l) => (
              <div key={l.id} style={{ borderBottom: "1px solid #ddd", padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {l.photos && l.photos[0] && <img src={"http://localhost:4000" + l.photos[0]} alt="Thumb" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />}
                  <div><b>{l.title}</b> — {l.price.toLocaleString()} ₺</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => startEdit(l)} style={{ background: "#f0ad4e", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => removeListing(l.id)} style={{ background: "#d9534f", color: "white", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
            {!mine.length && <p>You haven't published any listings yet.</p>}
          </div>

          <div>
            <h3>Incoming Viewing Requests</h3>
            {incoming.map((r) => (
              <div key={r.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10, borderRadius: 4 }}>
                <b>{r.listing.title}</b> · {new Date(r.date).toLocaleString()}
                <div>Requested by: {r.seeker?.name} ({r.seeker?.email})</div>
                {r.message && <div style={{ fontStyle: "italic", margin: "4px 0" }}>"{r.message}"</div>}
                <div>Status: <b style={{ color: r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "orange" }}>{r.status}</b></div>
                {r.status === "PENDING" && (
                  <div style={{ marginTop: 8 }}>
                    <button onClick={() => decide(r.id, "APPROVED")}>Approve</button> {" "}
                    <button onClick={() => decide(r.id, "REJECTED")}>Reject</button>
                  </div>
                )}
              </div>
            ))}
            {!incoming.length && <p>No incoming viewing requests yet.</p>}
          </div>
        </div>
      ) : (
        <div>
          <h3>My Rental Viewing Requests</h3>
          {myRequests.map((a) => (
            <div key={a.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 10, borderRadius: 4 }}>
              <b>{a.listing.title}</b> — {a.listing.address || ""} {a.listing.city ? `(${a.listing.city})` : ""}
              {a.listing.price && <div>Price: {a.listing.price.toLocaleString()} ₺/mo</div>}
              <div>Appointment Date: {new Date(a.date).toLocaleString()}</div>
              {a.message && <div style={{ fontStyle: "italic", margin: "4px 0" }}>Your note: "{a.message}"</div>}
              <div>Status: <b style={{ color: a.status === "APPROVED" ? "green" : a.status === "REJECTED" ? "red" : "orange" }}>{a.status}</b></div>
            </div>
          ))}
          {!myRequests.length && <p>You haven't requested any viewings yet.</p>}
        </div>
      )}
    </div>
  );
}