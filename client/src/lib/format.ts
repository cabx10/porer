import { Listing } from "../types";

export const locationText = (l: Pick<Listing, "neighborhood" | "district" | "city">) =>
  [l.neighborhood, l.district, l.city].filter(Boolean).join(", ");

export const coverPhoto = (l: Pick<Listing, "photos">) => l.photos?.[0];
