import { useQuery } from '@tanstack/react-query';

export interface BitcoinPrice {
  eur: number;
  usd: number;
  change24h: number;
  lastUpdated: Date;
}

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

async function fetchBitcoinPrice(): Promise<BitcoinPrice> {
  const response = await fetch(
    `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=eur,usd&include_24hr_change=true`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch Bitcoin price');
  }
  
  const data = await response.json();
  
  return {
    eur: data.bitcoin.eur,
    usd: data.bitcoin.usd,
    change24h: data.bitcoin.eur_24h_change || 0,
    lastUpdated: new Date(),
  };
}

export function useBitcoinPrice() {
  return useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: fetchBitcoinPrice,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider fresh for 30 seconds
    retry: 3,
  });
}

// Helper functions for conversions
export function eurToSats(eur: number, btcPrice: number): number {
  if (btcPrice <= 0) return 0;
  const btc = eur / btcPrice;
  return Math.round(btc * 100_000_000);
}

export function satsToEur(sats: number, btcPrice: number): number {
  const btc = sats / 100_000_000;
  return btc * btcPrice;
}

export function formatSats(sats: number): string {
  if (sats >= 100_000_000) {
    return `${(sats / 100_000_000).toFixed(2)} BTC`;
  }
  if (sats >= 1_000_000) {
    return `${(sats / 1_000_000).toFixed(2)}M sats`;
  }
  if (sats >= 1_000) {
    return `${(sats / 1_000).toFixed(1)}k sats`;
  }
  return `${sats.toLocaleString()} sats`;
}

export function formatEur(eur: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(eur);
}
