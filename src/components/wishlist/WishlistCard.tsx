import { Bookmark, Link2, Sparkles } from 'lucide-react';
import { formatEuros, formatSats } from '@/lib/format';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { BitcoinPriceData } from '@/hooks/useBitcoinPrice';
import type { WishlistItem } from '@/types/wishlist';

interface WishlistCardProps {
  item: WishlistItem;
  bitcoinPrice?: BitcoinPriceData;
}

export function WishlistCard({ item, bitcoinPrice }: WishlistCardProps) {
  // Calculate current BTC price in sats if we have live price data
  const currentPriceSats = bitcoinPrice && item.targetPriceEUR
    ? bitcoinPrice.euroToSats(item.targetPriceEUR)
    : item.currentPriceSats;

  // Progress: 0% = target price, 100% = saved enough (inverted logic for "saving up")
  // We're tracking if BTC price went UP (making target cheaper in sats)
  const progress = currentPriceSats && item.targetPriceSats > 0
    ? Math.max(0, Math.min(100, ((item.targetPriceSats - currentPriceSats) / item.targetPriceSats) * 100))
    : 0;

  const isReady = currentPriceSats ? currentPriceSats <= item.targetPriceSats : false;
  const targetInEuro = item.targetPriceEUR ?? (bitcoinPrice?.satsToEuro
    ? bitcoinPrice.satsToEuro(item.targetPriceSats)
    : undefined);

  const badgeVariant = isReady ? 'secondary' : 'outline';
  const badgeLabel = isReady ? 'Ziel erreicht!' : 'Am Sparen';

  return (
    <Card className="group bg-white/3 border-white/10 shadow-2xl shadow-orange-600/30">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-white leading-tight">{item.title}</CardTitle>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 mt-1"
              >
                <Link2 className="w-3 h-3" />
                Zum Shop
              </a>
            )}
          </div>
          {isReady && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs font-semibold">
              <Sparkles className="w-3 h-3 mr-1" />
              Bereit!
            </Badge>
          )}
        </div>
        <div className="flex items-start gap-4">
          {item.image && (
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent p-1 flex-shrink-0">
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full rounded-lg object-cover border border-white/10"
                loading="lazy"
              />
            </div>
          )}
          <div className="space-y-2 flex-1">
            <div>
              <p className="text-2xl font-bold text-white">
                {targetInEuro !== undefined ? formatEuros(targetInEuro) : '—'}
              </p>
              <p className="text-xs text-white/50">
                {formatSats(item.targetPriceSats)} sats
              </p>
            </div>
            {item.source && (
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-orange-300/80">
                <Bookmark className="w-3 h-3" />
                {item.source}
              </div>
            )}
          </div>
        </div>
        {currentPriceSats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Ersparnis durch BTC-Kurs</span>
              <span className="text-white font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 rounded-full bg-white/10" />
            <p className="text-[10px] text-white/50">
              Aktuell: {formatSats(currentPriceSats)} sats {currentPriceSats < item.targetPriceSats ? '✓' : ''}
            </p>
          </div>
        )}
      </CardHeader>
      {item.notes && (
        <CardContent className="space-y-2 pt-4">
          <p className="text-[10px] uppercase text-orange-300/60 tracking-wider">Notizen</p>
          <p className="text-sm text-white/80 leading-relaxed">{item.notes}</p>
        </CardContent>
      )}
      <CardFooter className="flex items-center justify-between pt-4 border-t border-white/10">
        {item.link ? (
          <Button
            variant="ghost"
            className="text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
            size="sm"
            asChild
          >
            <a href={item.link} target="_blank" rel="noreferrer">
              <Link2 className="w-3 h-3 mr-1" />
              Zum Produkt
            </a>
          </Button>
        ) : (
          <div />
        )}
        <span className="text-[10px] text-white/40">
          {new Date(item.createdAt * 1000).toLocaleDateString('de-DE')}
        </span>
      </CardFooter>
    </Card>
  );
}
