import { useQuery } from '@tanstack/react-query';

type BitcoinPriceResponse = {
  bitcoin: {
    eur: number;
  };
};

export interface BitcoinPriceData {
  /** Current BTC price in EUR */
  euro: number;
  /** The amount of sats you get for one euro */
  satsPerEuro: number;
  /** The euro value of one satoshi */
  euroPerSat: number;
  /** Helper to format sats values into EUR using latest price */
  satsToEuro: (sats: number) => number;
  /** Helper to format euros values into sats using latest price */
  euroToSats: (eur: number) => number;
}

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur';

export function useBitcoinPrice() {
  const query = useQuery({
    queryKey: ['bitcoin-price'],
    queryFn: async () => {
      const response = await fetch(COINGECKO_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load bitcoin price');
      }

      const payload = (await response.json()) as BitcoinPriceResponse;
      const euro = payload.bitcoin.eur;
      const satsPerEuro = euro > 0 ? Math.round((1 / euro) * 100_000_000) : 0;
      const euroPerSat = euro / 100_000_000;

      return {
        euro,
        satsPerEuro,
        euroPerSat,
      } satisfies Pick<BitcoinPriceData, 'euro' | 'satsPerEuro' | 'euroPerSat'>;
    },
    staleTime: 30_000,
  });

  const data: BitcoinPriceData | undefined = query.data
    ? {
        euro: query.data.euro,
        satsPerEuro: query.data.satsPerEuro,
        euroPerSat: query.data.euroPerSat,
        satsToEuro: (sats: number) => (sats / 100_000_000) * query.data.euro,
        euroToSats: (eur: number) => (eur / query.data.euro) * 100_000_000,
      }
    : undefined;

  return {
    ...query,
    data,
  };
}
