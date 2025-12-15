import { useQuery } from '@tanstack/react-query';

type ProxyResponse = string;

export interface ProductMetadata {
  title: string;
  description?: string;
  image?: string;
  priceEUR?: number;
  currency?: string;
  source?: string;
}

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

const getMetaContent = (doc: Document, selectors: string[]) => {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    const content = element?.getAttribute('content') ?? element?.getAttribute('value');
    if (content) {
      return content;
    }
  }
  return undefined;
};

const parsePrice = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const numeric = value.replace(/[€$£,]/g, '').trim();
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function useProductMetadata(url?: string) {
  return useQuery({
    queryKey: ['product-metadata', url],
    enabled: Boolean(url),
    queryFn: async ({ signal }) => {
      if (!url) {
        throw new Error('Missing URL');
      }

      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
        signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Unable to load remote page');
      }

      const html = (await response.text()) as ProxyResponse;
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const title =
        getMetaContent(doc, ["meta[property='og:title']", "meta[name='twitter:title']", 'title']) ??
        new URL(url).hostname;

      const description = getMetaContent(doc, ["meta[property='og:description']", "meta[name='description']"]);
      const image = getMetaContent(doc, ["meta[property='og:image']", "meta[name='twitter:image']"]);

      const price = parsePrice(
        getMetaContent(doc, ["meta[property='product:price:amount']", "meta[name='product:price:amount']", "meta[property='og:price:amount']"])
      );
      const currency =
        getMetaContent(doc, ["meta[property='product:price:currency']", "meta[name='product:price:currency']", "meta[property='og:price:currency']"]);

      return {
        title,
        description: description ?? undefined,
        image: image ?? undefined,
        priceEUR: price,
        currency: currency ?? undefined,
        source: new URL(url).hostname,
      } satisfies ProductMetadata;
    },
    staleTime: 1000 * 60 * 5,
  });
}
