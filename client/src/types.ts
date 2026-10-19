export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  type: "HOME" | "OFFICE";
  price: number;
  area: number;
  rooms: number;
  city: string;
  district?: string;
  neighborhood?: string;
  address: string;
  lat: number;
  lng: number;
  ownerId?: number;
  photos?: string[];
  owner?: User;
}

export interface Appointment {
  id: number;
  date: string;
  message?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  listing: { id?: number; title: string; address?: string; city?: string; price?: number };
  seeker?: { name: string; email: string };
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  receiverId: number;
  listingId?: number;
}