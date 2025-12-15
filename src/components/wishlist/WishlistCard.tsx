import { useState } from 'react';
import { Bookmark, Link2, Sparkles, Trash2, ExternalLink } from 'lucide-react';
import { formatEuros, formatSats } from '@/lib/format';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { BitcoinPriceData } from '@/hooks/useBitcoinPrice';
import type { WishlistItem } from '@/types/wishlist';

interface WishlistCardProps {
  item: WishlistItem;
  bitcoinPrice?: BitcoinPriceData;
  onDelete?: (itemId: string) => void;
}

export function WishlistCard({ item, bitcoinPrice, onDelete }: WishlistCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Aktueller Preis vom Shop (fest gespeichert)
  const currentPriceEUR = item.sourcePriceEUR;
  const currentPriceSats = bitcoinPrice && currentPriceEUR
    ? bitcoinPrice.euroToSats(currentPriceEUR)
    : undefined;

  // Zielpreis (mit Rabatt)
  const targetPriceEUR = item.targetPriceEUR;
  const targetPriceSats = item.targetPriceSats;

  // Fortschritt: Wie viel Rabatt wurde erreicht?
  // 0% = Aktueller Preis, 100% = Zielpreis erreicht
  const progress = currentPriceEUR && targetPriceEUR && currentPriceEUR > 0
    ? Math.max(0, Math.min(100, ((currentPriceEUR - targetPriceEUR) / currentPriceEUR) * 100))
    : 0;

  const isReady = currentPriceSats && targetPriceSats
    ? currentPriceSats <= targetPriceSats
    : false;

  return (
    <>
      <Card className="group bg-white/3 border-white/10 shadow-2xl shadow-orange-600/30 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete?.(item.id)}
          className="absolute top-2 right-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 z-10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 cursor-pointer" onClick={() => setDetailsOpen(true)}>
              <CardTitle className="text-lg font-bold text-white leading-tight hover:text-orange-300 transition-colors">
                {item.title}
              </CardTitle>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 mt-1"
                  onClick={(e) => e.stopPropagation()}
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
            <div
              className="h-20 w-20 rounded-xl bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent p-1 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setDetailsOpen(true)}
            >
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
              <p className="text-xs text-white/60">Zielpreis</p>
              <p className="text-2xl font-bold text-white">
                {targetPriceEUR !== undefined ? formatEuros(targetPriceEUR) : '—'}
              </p>
              <p className="text-xs text-white/50">
                {formatSats(targetPriceSats)} sats
              </p>
              {currentPriceEUR && currentPriceEUR !== targetPriceEUR && (
                <p className="text-xs text-white/40 mt-1">
                  Aktuell: {formatEuros(currentPriceEUR)}
                </p>
              )}
            </div>
            {item.source && (
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-orange-300/80">
                <Bookmark className="w-3 h-3" />
                {item.source}
              </div>
            )}
          </div>
        </div>
        {currentPriceEUR && targetPriceEUR && currentPriceEUR !== targetPriceEUR && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Rabatt-Fortschritt</span>
              <span className="text-white font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 rounded-full bg-white/10" />
            <div className="flex justify-between text-[10px] text-white/50">
              <span>Aktuell: {formatEuros(currentPriceEUR)}</span>
              <span>Ziel: {formatEuros(targetPriceEUR)}</span>
            </div>
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

    {/* Detail Dialog */}
    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DialogContent className="max-w-2xl bg-[#0c0c11] border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white pr-8">{item.title}</DialogTitle>
          {item.source && (
            <DialogDescription className="flex items-center gap-2 text-orange-300/80">
              <Bookmark className="w-4 h-4" />
              {item.source}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Image */}
          {item.image && (
            <div className="w-full h-64 rounded-xl bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent p-2">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full rounded-lg object-contain"
                loading="lazy"
              />
            </div>
          )}

          {/* Price Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <p className="text-sm text-white/60">Zielpreis (mit Rabatt)</p>
                <p className="text-3xl font-bold text-white">
                  {targetPriceEUR !== undefined ? formatEuros(targetPriceEUR) : '—'}
                </p>
                <p className="text-sm text-white/50">
                  {formatSats(targetPriceSats)} sats
                </p>
              </CardHeader>
            </Card>

            {currentPriceEUR && (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <p className="text-sm text-white/60">Aktueller Preis (Shop)</p>
                  <p className="text-3xl font-bold text-white">
                    {formatEuros(currentPriceEUR)}
                  </p>
                  <p className="text-sm text-white/50">
                    {currentPriceSats ? `${formatSats(currentPriceSats)} sats` : '—'}
                  </p>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Progress */}
          {currentPriceEUR && targetPriceEUR && currentPriceEUR !== targetPriceEUR && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Rabatt-Fortschritt</span>
                <span className="text-white font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3 rounded-full bg-white/10" />
              <div className="flex justify-between text-xs text-white/50">
                <span>Gespart: {formatEuros(currentPriceEUR - targetPriceEUR)}</span>
                {isReady && <span className="text-green-400">✓ Ziel erreicht!</span>}
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="space-y-2">
              <p className="text-xs uppercase text-orange-300/60 tracking-wider">Notizen</p>
              <p className="text-base text-white/90 leading-relaxed whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {/* Link */}
          {item.link && (
            <Button
              variant="default"
              className="w-full"
              size="lg"
              asChild
            >
              <a href={item.link} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Zum Produkt
              </a>
            </Button>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-white/40 pt-4 border-t border-white/10">
            <span>Hinzugefügt am {new Date(item.createdAt * 1000).toLocaleDateString('de-DE')}</span>
            {isReady && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Bereit!
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
