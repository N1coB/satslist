import { useState } from 'react';
import { useToast } from '@/hooks/useToast';

export interface ProductMetadata {
  title: string;
  imageUrl: string;
  price: number;
}

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

export function useProductMetadata() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const extractMetadata = async (url: string): Promise<ProductMetadata | null> => {
    setIsLoading(true);
    try {
      // Validate URL
      new URL(url);

      // Fetch with CORS proxy
      const proxyUrl = CORS_PROXY + encodeURIComponent(url);
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const metadata = parseMetadata(html, url);

      if (!metadata || !metadata.title || !metadata.price) {
        throw new Error('Konnte Produktdaten nicht extrahieren');
      }

      return metadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fehler beim Laden';
      toast({
        title: 'Fehler beim Laden des Produkts',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    extractMetadata,
    isLoading,
  };
}

function parseMetadata(html: string, baseUrl: string): ProductMetadata | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract title
    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="title"]')?.getAttribute('content') ||
      doc.querySelector('h1')?.textContent ||
      'Produkt';

    // Extract image
    let imageUrl =
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="image"]')?.getAttribute('content') ||
      doc.querySelector('img[alt*="product"]')?.getAttribute('src') ||
      '';

    // Make image URL absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = resolveUrl(imageUrl, baseUrl);
    }

    // Extract price
    let price: number | null = null;

    // Try OG price
    const ogPrice = doc.querySelector('meta[property="og:price"]')?.getAttribute('content');
    if (ogPrice) {
      price = parsePrice(ogPrice);
    }

    // Try structured data (JSON-LD)
    if (!price) {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent || '{}');
          if (json.offers?.price) {
            price = parsePrice(json.offers.price);
            break;
          }
        } catch {
          // Continue searching
        }
      }
    }

    // Fallback: search in HTML for price patterns
    if (!price) {
      const priceText = html;
      const priceMatch = priceText.match(
        /(?:price|preis|€|eur)[\s:]*[\d.,]+(?:\s*€)?/gi
      );
      if (priceMatch) {
        const priceStr = priceMatch[0];
        price = parsePrice(priceStr);
      }
    }

    // Default to 0 if no price found
    if (!price) {
      price = 0;
    }

    return {
      title: title.trim().substring(0, 100),
      imageUrl: imageUrl || '',
      price,
    };
  } catch (error) {
    console.error('Parse error:', error);
    return null;
  }
}

function parsePrice(priceStr: string): number {
  // Remove non-numeric except . and ,
  const cleaned = priceStr
    .replace(/[^\d.,]/g, '')
    .replace(/\s/g, '');

  // Handle European format (1.234,56)
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }

  // Handle US format (1,234.56)
  return parseFloat(cleaned.replace(/,/g, ''));
}

function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}
