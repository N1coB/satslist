# SatsList - Custom NIP Documentation

## Overview

SatsList uses NIP-78 (Application-specific Data) for storing user wishlist data on Nostr relays.

## Event Kind

**Kind**: `30078` (Addressable Event - NIP-78)

This is a standard NIP-78 application-specific data event, using the addressable event format to ensure only the latest version is stored.

## Event Structure

### Tags

| Tag | Description | Required |
|-----|-------------|----------|
| `d` | Fixed identifier: `satslist-wishlist-v1` | Yes |
| `alt` | Human-readable description: `SatsList Bitcoin Wishlist` | Yes |

### Content

The content field contains a JSON-encoded `WishlistData` object:

```typescript
interface WishlistData {
  items: WishlistItem[];
  version: number;
}

interface WishlistItem {
  id: string;              // Unique item identifier (e.g., "item_1234567890_abc123def")
  name: string;            // Product name
  url: string;             // Product URL (ShopInBit, etc.)
  priceEur: number;        // Product price in EUR
  targetBtcPrice: number;  // Target Bitcoin price in EUR at which to buy
  imageUrl?: string;       // Optional product image URL
  notes?: string;          // Optional user notes
  createdAt: number;       // Unix timestamp (milliseconds)
  updatedAt: number;       // Unix timestamp (milliseconds)
  purchased?: boolean;     // Whether the item has been purchased
  purchasedAt?: number;    // Unix timestamp when purchased (milliseconds)
}
```

## Example Event

```json
{
  "kind": 30078,
  "pubkey": "<user-pubkey>",
  "created_at": 1702345678,
  "tags": [
    ["d", "satslist-wishlist-v1"],
    ["alt", "SatsList Bitcoin Wishlist"]
  ],
  "content": "{\"items\":[{\"id\":\"item_1702345678000_abc123\",\"name\":\"Sony WH-1000XM5\",\"url\":\"https://shopinbit.com/product/123\",\"priceEur\":299.99,\"targetBtcPrice\":150000,\"createdAt\":1702345678000,\"updatedAt\":1702345678000}],\"version\":1}",
  "id": "<event-id>",
  "sig": "<signature>"
}
```

## Querying

To retrieve a user's wishlist:

```typescript
const filter = {
  kinds: [30078],
  authors: [userPubkey],
  '#d': ['satslist-wishlist-v1'],
  limit: 1,
};
```

## Privacy Considerations

- Wishlist data is stored unencrypted on public Nostr relays
- Anyone can see a user's wishlist if they know their public key
- For sensitive wishlists, users should consider:
  - Using private relays
  - Future versions may support NIP-44 encryption

## Versioning

The `version` field in the content allows for future schema migrations:
- Version 1: Initial schema (current)

## Interoperability

This data format is specific to SatsList and uses NIP-78's designated kind for application-specific data. Other applications should not attempt to interpret this data unless they are SatsList-compatible clients.
