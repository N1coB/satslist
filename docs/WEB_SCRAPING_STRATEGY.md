# Web Scraping Strategy für SatsList

## Gewählte Strategie: Open Graph Meta Tags + HTML Fallback

**Best Solution weil:**
- ✅ Jeder Shop hat Standard Meta Tags
- ✅ CORS-kompatibel mit Proxy
- ✅ Schnell und zuverlässig
- ✅ User kann korrigieren (Hybrid)

**Meta Tags nutzen:**
- `og:title` → Produktname
- `og:image` → Produktbild
- `og:price` / `price` → Preis

**Fallback für Shops ohne OG:**
- HTML Meta Tags: `<meta name="description">`
- Price Pattern Matching mit Regex
- Image Fallback auf Icon
