export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string | null;
}

export type ListingType = "HOME" | "OFFICE";

export interface Listing {
  id: number;
  title: string;
  description: string;
  type: ListingType;
  price: number;
  area: number;
  rooms: number;
  city: string;
  district?: string | null;
  neighborhood?: string | null;
  address: string;
  lat: number;
  lng: number;
  ownerId: number;
  photos: string[];
  createdAt: string;
  owner?: { id: number; name: string; phone?: string | null };
}

export interface ListingPage {
  items: Listing[];
  total: number;
  page: number;
  pages: number;
}

export type AppointmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Appointment {
  id: number;
  date: string;
  message?: string | null;
  status: AppointmentStatus;
  createdAt?: string;
  listing: { id: number; title: string; address?: string; city?: string; price?: number };
  seeker?: { name: string; email: string };
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  receiverId: number;
  listingId?: number | null;
}

export interface Conversation {
  listingId: number;
  listingTitle: string;
  listingPhoto?: string;
  otherUser: { id: number; name: string };
  lastMessage: string;
  date: string;
}
