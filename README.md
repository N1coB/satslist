# 🚀 SatsList - Bitcoin Wunschliste

Erstelle deine Bitcoin-Wunschliste. Kaufe Produkte automatisch, wenn dein Zielpreis erreicht ist. HODL und belohne dich selbst! 🧡

## Features

- ⚡ **Live Bitcoin-Preis** - Echtzeit EUR-Preis von CoinGecko
- 🛍️ **Produkte-Verwaltung** - Füge Produkte mit Preis und Zielpreis hinzu
- 💰 **Sats-Kalkulation** - Sehe wieviele Sats du sparst beim Warten
- 📊 **Progress Tracking** - Fortschrittsanzeige zum Zielpreis
- 🔔 **Zielpreis-Alert** - Benachrichtigung wenn Preis erreicht wird
- 🔐 **Nostr-Speicherung** - Deine Daten gehören dir (NIP-78)
- 🌙 **Dark Mode** - Automatisch oder manuell
- 📱 **Responsive** - Optimiert für Mobile & Desktop

## Tech Stack

- **React 18** - Modern UI Framework
- **TypeScript** - Type-safe Development
- **TailwindCSS** - Responsive Styling
- **shadcn/ui** - Beautiful Components
- **Nostrify** - Nostr Protocol Integration
- **TanStack Query** - Data Fetching & Caching
- **Vite** - Fast Build Tool

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
npm run dev
```

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

## How It Works

1. **Login** mit deiner Nostr-Extension (Alby, nos2x, etc.)
2. **Produkt hinzufügen** - Name, Link, EUR-Preis
3. **Zielpreis setzen** - Bei welchem BTC/EUR-Kurs du kaufen möchtest
4. **HODL & Warten** - Die App zeigt deinen Fortschritt
5. **Kaufen** wenn der Zielpreis erreicht ist! 🎉

## Data Storage

- Alle Wunschlisten werden auf **Nostr-Relays** gespeichert (NIP-78)
- Deine Daten sind **verschlüsselt** und gehören nur dir
- Funktioniert auf jedem Gerät mit deinem Nostr-Login

## Deployment

Diese App wird automatisch deployt via GitHub Pages bei jedem Push zu `main`.

Deploy-URL: https://N1coB.github.io/satslist

## Nostr Integration

- **Kind 30078** - Addressable Event (NIP-78) für Wunschlisten-Speicherung
- **d-tag**: `satslist-wishlist-v1`
- **NWC-Ready** - Prepared für Nostr Wallet Connect Integration

## License

MIT

## Vibed with Shakespeare

Diese App wurde mit ❤️ und Bitcoin-Orange gebaut via [Shakespeare](https://shakespeare.diy)

[![Edit with Shakespeare](https://shakespeare.diy/badge.svg)](https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FN1coB%2Fsatslist.git)

---

**Author**: NicoB ([@nicobe@nostrplebs.com](https://nostrplebs.com/@nicobe))

⚡ Lightning: nicob@getalby.com

🔐 HODL • ⚡ Build • 🚀 Ship
