export interface WishlistItem {
  id: string;
  createdAt: number;
  title: string;
  link?: string;
  image?: string;
  notes?: string;
  targetPriceSats: number;
  targetPriceEUR?: number;
  currentPriceSats?: number;
  sourcePriceEUR?: number;
  source?: string;
  status?: "dreaming" | "tracking" | "ready";
  eventId: string;
}

export interface WishlistPayload {
  id?: string;
  title: string;
  link?: string;
  image?: string;
  notes?: string;
  targetPriceSats: number;
  targetPriceEUR?: number;
  currentPriceSats?: number;
  sourcePriceEUR?: number;
  source?: string;
}
