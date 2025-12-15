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
  const current = item.currentPriceSats ?? item.targetPriceSats;
  const progress = Math.min(1, current / Math.max(1, item.targetPriceSats));
  const isReady = current <= item.targetPriceSats;
  const targetInEuro = bitcoinPrice?.satsToEuro
    ? bitcoinPrice.satsToEuro(item.targetPriceSats)
    : undefined;

  const badgeVariant = isReady ? 'secondary' : 'outline';
  const badgeLabel = isReady ? 'Zielpreis erreicht' : 'Am Beansparen';

  return (
    <Card className="group bg-white/3 border-white/10 shadow-2xl shadow-orange-600/30">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-white">{item.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-orange-300 hover:text-orange-200"
                >
                  <Link2 className="w-3 h-3" />
                  Shop öffnen
                </a>
              ) : (
                'Kein Link hinterlegt'
              )}
            </p>
          </div>
          <Badge variant={badgeVariant} className="uppercase text-xs font-semibold tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span className="ml-1">
              {badgeLabel}
            </span>
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500/40 via-orange-400/20 to-transparent p-1">
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full rounded-xl object-cover border border-white/10"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-white/30 bg-white/5 text-xs uppercase tracking-wide text-white/70">
                {item.title.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              Ziel: <span className="text-white font-semibold">{formatSats(item.targetPriceSats)} sats</span>
            </p>
            {targetInEuro !== undefined && (
              <p>
                ≈ {formatEuros(targetInEuro)}
              </p>
            )}
            {item.source && (
              <p className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-orange-200">
                <Bookmark className="w-3 h-3" />
                {item.source}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            <span>Fortschritt</span>
            <span className="text-white font-semibold">{Math.round(progress * 100)}%</span>
          </div>
          <Progress value={progress * 100} className="h-2 rounded-full bg-white/10" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-white/90">
        <p className="text-xs uppercase text-orange-200 tracking-[0.3em]">Notizen</p>
        <p className="text-sm text-white/90">{item.notes ?? 'Keine Notizen vorhanden.'}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3">
        <Button
          variant="ghost"
          className="text-xs tracking-wide text-white/80 hover:text-white"
          size="sm"
          asChild
        >
          <a href={item.link ?? '#'} target="_blank" rel="noreferrer">
            Produkt öffnen
          </a>
        </Button>
        <span className="text-xs text-muted-foreground">
          Hinzugefügt {new Date(item.createdAt * 1000).toLocaleDateString('de-DE')}
        </span>
      </CardFooter>
    </Card>
  );
}
