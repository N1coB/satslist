export interface WishlistItem {
  id: string;
  name: string;
  url: string;
  priceEur: number;
  targetBtcPrice: number; // Bitcoin price in EUR at which to buy
  imageUrl?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  purchased?: boolean;
  purchasedAt?: number;
}

export interface WishlistData {
  items: WishlistItem[];
  version: number;
}

export function createEmptyWishlist(): WishlistData {
  return {
    items: [],
    version: 1,
  };
}

export function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
