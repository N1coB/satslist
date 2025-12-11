# 🚀 SatsList Developer Guidelines

Diese Guidelines definieren die Entwicklungsstandards für SatsList, eine moderne Webanwendung, die auf GitHub Pages (statischer Host) gehostet wird.

## 📋 Übersicht

- **Performance & Architektur**: Client-Side Rendering mit optimiertem Asset-Loading
- **Sicherheit**: Strikte CSP, Input-Sanitization, XSS-Prävention
- **Code-Qualität**: TypeScript, ESLint, Test-Abdeckung

---

## 🚀 Performance & Architektur (Statische Limitationen)

GitHub Pages ist ein statischer Host – die gesamte Last liegt beim Client.

### Client-Side Rendering (CSR)

- **Keine SSR/Statische Generierung**: Ausschließlich React CSR
- **Vite Optimierung**: Tree-shaking und Minification bereits konfiguriert
- Tools: React 18, Vite, TypeScript

### Asset-Optimierung (Core Web Vitals)

**Code-Splitting:**
```typescript
// ✅ Lazy Loading für Routes
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Settings = lazy(() => import('@/pages/Settings'));

// Wrap in Suspense
<Suspense fallback={<Skeleton />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

**Datenmanagement & Caching:**
- IndexedDB für Nostr-Daten (bereits implementiert)
- Service Workers für Asset-Caching (empfohlen für Zukunft)
- React Query für API-Caching mit intelligent TTL

**Bundle Size Rules:**
- Main bundle < 100KB (gzipped)
- Lazy-loaded chunks < 50KB (gzipped)
- Prüfe mit: `npm run build && ls -lh dist/`

---

## 🔒 Sicherheits-Guidelines (Statische Hosts)

Ohne schützenden Backend muss die App extrem widerstandsfähig sein.

### Content Security Policy (CSP) - STRICT

```html
<!-- ✅ SatsList CSP Header -->
<meta http-equiv="content-security-policy" 
  content="default-src 'none'; 
    script-src 'self'; 
    style-src 'self'; 
    font-src 'self' https:; 
    connect-src 'self' blob: https: wss:; 
    img-src 'self' data: blob: https:; 
    object-src 'none'; 
    upgrade-insecure-requests">
```

**Regeln:**
- ❌ Kein `'unsafe-inline'` für Scripts oder Styles
- ❌ Kein `eval()`
- ✅ Nur HTTPS (`upgrade-insecure-requests`)
- ✅ Keine externe Skripte ohne `nonce`

### Input & Output Sanitization (XSS-Prävention)

**Alle User-Inputs müssen sanitized werden:**

```typescript
// ✅ Richtig: Mit DOMPurify
import DOMPurify from 'dompurify';

const userInput = "Hello <script>alert('xss')</script>";
const safe = DOMPurify.sanitize(userInput, { ALLOWED_TAGS: [] });
// Output: "Hello "

// ✅ Richtig: Bei Web-Scraping
const title = DOMPurify.sanitize(externalData.title, { ALLOWED_TAGS: [] });

// ❌ Falsch: Direkter HTML-Einsatz
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Wo Sanitization nötig:**
- Produkt-Namen (von externen Shops gescraped)
- User-generierte Notizen
- Beliebige Daten von externen APIs
- Alles außer vertrauentem App-Code

### Externe API-Schlüssel

**Problematisch:**
```typescript
// ❌ NIEMALS Secrets im Code!
const API_KEY = "sk_live_abc123"; // Öffentlich sichtbar!
```

**Lösungen:**
1. **Public APIs ohne Secret** (z.B. CoinGecko): OK im Code
2. **Secrets nötig**: Proxy-Server verwenden (nicht auf GitHub Pages!)
3. **Alternative**: User gibt Key selbst ein (localStorage, nicht synced)

**Für SatsList aktuell:**
- ✅ CoinGecko API: Public, OK
- ✅ CORS Proxy: Public, OK
- ⚠️ Zukünftig: Falls Wallet-Integration → NWC nutzen, nie Secret im Code

---

## 📐 Code-Qualität und Wartbarkeit

### Code-Stil & Linting

**ESLint & Prettier:**
```bash
npm run lint         # ESLint Check
npm run format       # Prettier Format
```

**Pre-Commit Hook (in Zukunft empfohlen):**
```bash
# .husky/pre-commit
npm run lint
npm run format
```

### TypeScript Standards

- ❌ Nie `any` verwenden
- ✅ Explizite Typen für Funktionen
- ✅ Strenge `tsconfig.json` (bereits konfiguriert)

```typescript
// ✅ Richtig
interface Product {
  id: string;
  name: string;
  price: number;
}

function addProduct(item: Product): void {
  // ...
}

// ❌ Falsch
function addProduct(item: any) { // any!
  // ...
}
```

### Test-Abdeckung Standards

**Anforderung: >80% Branch Coverage**

```typescript
// Vitest ist konfiguriert, nutze es für:
// - Unit Tests für Hooks
// - Component Tests für UI
// - Integration Tests für Nostr-Funktionen

import { describe, it, expect } from 'vitest';
import { useProductMetadata } from '@/hooks/useProductMetadata';

describe('useProductMetadata', () => {
  it('should extract title from OG tags', async () => {
    const metadata = await extractMetadata('https://example.com');
    expect(metadata?.title).toBeDefined();
  });
});
```

**Beispiele was testen:**
- `useWishlist` Hook - alle CRUD Operationen
- `useProductMetadata` - HTML-Parsing mit verschiedenen Formaten
- `ProductImportDialog` - Benutzerflows
- `useBitcoinPrice` - Price-Fetching & Fehlerbehandlung

---

## 🛠️ Best Practices für SatsList

### Fehlerbehandlung

```typescript
// ✅ Richtig: Error Boundaries + graceful fallback
try {
  const data = await fetchBitcoinPrice();
  setPrice(data);
} catch (error) {
  console.error('Price fetch failed:', error);
  toast({
    title: 'Fehler',
    description: 'Bitcoin-Preis konnte nicht geladen werden',
    variant: 'destructive',
  });
  // Fallback: Letzter bekannter Preis
}
```

### Performance Monitoring

```typescript
// Nutze Browser DevTools
// Lighthouse: npm run build && npx http-server dist/
// Performance Tab: Check Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS)
```

### Asset-Loading für externe URLs

```typescript
// ✅ Mit Timeout und Fehlerbehandlung
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000), // Timeout!
});

// ✅ Mit Fallback-Image
<img 
  src={imageUrl} 
  alt="Product" 
  onError={(e) => {
    e.currentTarget.src = '/fallback-image.png';
  }} 
/>
```

---

## 🔄 Deployment & Release Checklist

Vor jedem Deploy zu GitHub Pages:

- [ ] `npm run lint` erfolgreich
- [ ] `npm run test` erfolgreich (wenn Tests vorhanden)
- [ ] `npm run build` erfolgreich
- [ ] Keine Warnings im Build
- [ ] CSP Header korrekt (kein `unsafe-inline`)
- [ ] Sensible Daten nicht im Code
- [ ] Git Commit mit aussagekräftiger Message

---

## 📚 Referenzen

- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Vitals - Google](https://web.dev/vitals/)
- [DOMPurify Dokumentation](https://github.com/cure53/DOMPurify)

---

**Last Updated**: 2025-12-11  
**Version**: 1.0
