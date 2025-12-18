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

  // Fortschritts-Berechnungen (Sats-basiert)
  let satsDifference = 0; // Differenz zwischen aktuellem Shop-Preis in Sats und Zielpreis in Sats
  let progressPercentage = 0; // Prozentualer Fortschritt für die Bar
  let savingsInEuro = 0; // Ersparnis in Euro

  if (currentPriceSats && targetPriceSats) {
    satsDifference = currentPriceSats - targetPriceSats;

    if (currentPriceSats > 0) {
      progressPercentage = (satsDifference / currentPriceSats) * 100;
      // Fortschritt für die Bar auf 0-100 clippen
      progressPercentage = Math.max(0, Math.min(100, progressPercentage));
    }

    if (bitcoinPrice) {
      savingsInEuro = bitcoinPrice.satsToEuro(satsDifference);
    }
  }

  const isReady = currentPriceSats && targetPriceSats
    ? currentPriceSats <= targetPriceSats
    : false;

  return (
    <>
      <Card className="group bg-white/3 border-white/10 shadow-2xl shadow-orange-600/30 relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(item.id);
          }}
          className="absolute top-2 right-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 z-20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <CardHeader className="space-y-3 relative z-10">
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

        {/* Fortschrittsbalken auf Karte */}
        {currentPriceSats && targetPriceSats && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">Fortschritt</span>
              <span className="text-white font-semibold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 rounded-full bg-white/10" />
            <div className="flex justify-between text-[10px] text-white/50">
              <span>Aktuell: {formatSats(currentPriceSats)} sats</span>
              <span className={satsDifference < 0 ? "text-emerald-400 font-semibold" : "text-orange-400 font-semibold"}>
                {savingsInEuro < 0 ? `+${formatEuros(Math.abs(savingsInEuro))}` : `-${formatEuros(savingsInEuro)}`}
              </span>
              <span>Ziel: {formatSats(targetPriceSats)} sats</span>
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
          <span className="text-xs text-white/50">Kein Produktlink verfügbar</span>
        )}
        <span className="text-[10px] text-white/40">
          Hinzugefügt am {new Date(item.createdAt * 1000).toLocaleDateString('de-DE')}
        </span>
      </CardFooter>
    </Card>

    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DialogContent className={'max-w-sm sm:max-w-lg lg:max-w-xl w-11/12 mx-auto bg-slate-900 border-white/20 p-6'}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white pr-8 leading-snug">{item.title}</DialogTitle>
          {item.source && (
            <DialogDescription className="flex items-center gap-2 text-orange-200/80">
              <Bookmark className="w-4 h-4" />
              {item.source}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Image */}
          {item.image && (
            <div
              className="h-48 w-full max-w-full rounded-xl bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent p-2 flex items-center justify-center"
              onClick={() => setDetailsOpen(true)}
            >
              <img
                src={item.image}
                alt={item.title}
                className="max-h-full max-w-full rounded-lg object-contain border border-white/10"
                loading="lazy"
              />
            </div>
          )}

          {/* Preis-Übersicht */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {/* Zielpreis - IMMER anzeigen */}
            <Card className="bg-gradient-to-br from-slate-800/70 to-slate-800/40 border-orange-500/40 text-white p-4 shadow-lg">
              <CardHeader className="p-0 pb-2">
                <p className="text-sm text-orange-200/80 mb-2">Dein Zielpreis</p>
                <p className="text-3xl font-bold leading-tight">
                  {targetPriceEUR !== undefined ? formatEuros(targetPriceEUR) : '—'}
                </p>
                <p className="text-sm text-white/70 mt-2">
                  {formatSats(targetPriceSats)} sats
                </p>
              </CardHeader>
              {isReady && (
                <div className="mt-4">
                  <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/40 text-sm px-3 py-1">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Ziel erreicht!
                  </Badge>
                </div>
              )}
            </Card>

            {/* Aktueller Preis - nur wenn vorhanden */}
            {currentPriceEUR && (
              <Card className="bg-white/5 border-white/10 text-white p-4">
                <CardHeader className="p-0 pb-2">
                  <p className="text-sm text-white/60 mb-2">Aktueller Shop-Preis</p>
                  <p className="text-3xl font-bold leading-tight">
                    {formatEuros(currentPriceEUR)}
                  </p>
                  <p className="text-sm text-white/50 mt-2">
                    {currentPriceSats ? `${formatSats(currentPriceSats)} sats` : '—'}
                  </p>
                </CardHeader>
              </Card>
            )}

            {/* Fortschrittsbalken - nur wenn beide Preise vorhanden und der aktuelle Preis über dem Ziel liegt */}
            {currentPriceSats && targetPriceSats && satsDifference > 0 && (
              <Card className="bg-white/5 border-white/10 text-white p-4">
                <CardHeader className="p-0 pb-3">
                  <p className="text-sm text-white/60 mb-3">Fortschritt</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Differenz in %</span>
                      <span className="text-2xl font-bold text-orange-300">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-4 rounded-full bg-white/10" />
                    <div className="flex justify-between text-sm text-white/60">
                      <span>{formatSats(currentPriceSats)} sats</span>
                      <span className={satsDifference < 0 ? "text-emerald-400 font-semibold" : "text-orange-400 font-semibold"}>
                        {savingsInEuro < 0 ? `+${formatEuros(Math.abs(savingsInEuro))}` : `-${formatEuros(savingsInEuro)}`}
                      </span>
                      <span>{formatSats(targetPriceSats)} sats</span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="space-y-2">
              <p className="text-xs uppercase text-orange-200/60 tracking-wider">Notizen</p>
              <p className="text-base text-white/90 leading-relaxed whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {/* Link */}
          <Button
            variant="default"
            className="w-full bg-orange-600 hover:bg-orange-500 text-white"
            size="lg"
            asChild
          >
            <a href={item.link} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              {item.link ? 'Zum Produkt' : 'Kein Produktlink verfügbar'}
            </a>
          </Button>

          {/* Meta */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 pt-4 border-t border-white/10 mt-6">
            <span>Hinzugefügt am {new Date(item.createdAt * 1000).toLocaleDateString('de-DE')}</span>
            {isReady && (
              <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mt-2 sm:mt-0">
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
