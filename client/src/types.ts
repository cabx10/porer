export type Role = "OWNER" | "SEEKER";
export interface User { id: number; name: string; role: Role }
export interface Listing {
  id: number; title: string; description: string; type: "HOME" | "OFFICE";
  price: number; area: number; rooms: number; city: string; address: string; lat: number; lng: number;
}
export interface Appointment {
  id: number; date: string; message?: string; status: "PENDING" | "APPROVED" | "REJECTED";
  listing: { title: string; address?: string }; seeker?: { name: string; email: string };
}
