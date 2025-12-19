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
  let percentGapRelativeCurrent = 0; // Wie viel Prozent der aktuelle Preis oberhalb des Ziels liegt (bezogen auf aktuellen Preis)
  let percentOvershootRelativeTarget = 0; // Wie weit wir das Ziel bereits unterschritten haben (bezogen auf Zielpreis)
  let progressPercentage = 0; // Fortschritt in % für die Progress-Bar (0 = keine Ersparnis, 100 = Ziel erreicht)
  let savingsInEuro = 0; // Ersparnis in Euro

  if (currentPriceSats && targetPriceSats) {
    satsDifference = currentPriceSats - targetPriceSats;

    if (currentPriceSats > 0) {
      percentGapRelativeCurrent = (satsDifference / currentPriceSats) * 100;
      percentGapRelativeCurrent = Number.isFinite(percentGapRelativeCurrent) ? percentGapRelativeCurrent : 0;
    }

    if (targetPriceSats > 0) {
      percentOvershootRelativeTarget = (satsDifference / targetPriceSats) * 100;
      percentOvershootRelativeTarget = Number.isFinite(percentOvershootRelativeTarget) ? percentOvershootRelativeTarget : 0;
    }

    // Fortschritt: 0% = gar kein Rabatt, 100% = Ziel erreicht oder unterschritten
    progressPercentage = Math.max(0, Math.min(100, 100 - Math.max(0, percentGapRelativeCurrent)));

    if (bitcoinPrice) {
      savingsInEuro = bitcoinPrice.satsToEuro(satsDifference);
    }
  }

  const isReady = currentPriceSats && targetPriceSats
    ? currentPriceSats <= targetPriceSats
    : false;

  return (
    <>
      <Card className="group bg-card border border-border shadow-lg relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(item.id);
          }}
          className="absolute top-2 right-2 text-foreground/40 hover:text-destructive hover:bg-destructive/10 z-20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <CardHeader className="space-y-3 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 cursor-pointer" onClick={() => setDetailsOpen(true)}>
              <CardTitle className="text-lg font-bold text-foreground leading-tight hover:text-accent transition-colors">
                {item.title}
              </CardTitle>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/90 mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link2 className="w-3 h-3" />
                  Zum Shop
                </a>
              )}
            </div>
            {isReady && (
              <Badge variant="secondary" className="bg-success/20 text-success border-success/30 text-xs font-semibold">
                <Sparkles className="w-3 h-3 mr-1" />
                Bereit!
              </Badge>
            )}
          </div>
        <div className="flex items-start gap-4">
          {item.image && (
            <div
              className="h-20 w-20 rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent p-1 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setDetailsOpen(true)}
            >
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full rounded-lg object-cover border border-border"
                loading="lazy"
              />
            </div>
          )}
          <div className="space-y-2 flex-1">
            <div>
              <p className="text-xs text-foreground/60">Zielpreis</p>
              <p className="text-2xl font-bold text-foreground">
                {targetPriceEUR !== undefined ? formatEuros(targetPriceEUR) : '—'}
              </p>
              <p className="text-xs text-foreground/50">
                {formatSats(targetPriceSats)} sats
              </p>
              {currentPriceEUR && currentPriceEUR !== targetPriceEUR && (
                <p className="text-xs text-foreground/40 mt-1">
                  Aktuell: {formatEuros(currentPriceEUR)}
                </p>
              )}
            </div>
            {item.source && (
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent/80">
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
              <span className="text-foreground/60">Fortschritt</span>
              <span className="text-foreground font-semibold">
                {satsDifference > 0
                  ? `${Math.round(percentGapRelativeCurrent)}% bis Ziel`
                  : `${Math.round(Math.abs(percentOvershootRelativeTarget))}% unter Ziel`}
              </span>
            </div>
            <Progress value={progressPercentage ?? 0} className="h-2 rounded-full bg-muted" />
            <div className="flex justify-between text-[10px] text-foreground/50">
              <span>Aktuell: {formatSats(currentPriceSats)} sats</span>
              <span className={satsDifference < 0 ? "text-success font-semibold" : "text-accent font-semibold"}>
                {savingsInEuro < 0 ? `+${formatEuros(Math.abs(savingsInEuro))}` : `-${formatEuros(savingsInEuro)}`}
              </span>
              <span>Ziel: {formatSats(targetPriceSats)} sats</span>
            </div>
          </div>
        )}
      </CardHeader>
      {item.notes && (
        <CardContent className="space-y-2 pt-4">
          <p className="text-[10px] uppercase text-accent/60 tracking-wider">Notizen</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{item.notes}</p>
        </CardContent>
      )}
      <CardFooter className="flex items-center justify-between pt-4 border-t border-border">
        {item.link ? (
          <Button
            variant="ghost"
            className="text-xs text-accent hover:text-accent/90 hover:bg-accent/10"
            size="sm"
            asChild
          >
            <a href={item.link} target="_blank" rel="noreferrer">
              <Link2 className="w-3 h-3 mr-1" />
              Zum Produkt
            </a>
          </Button>
        ) : (
          <span className="text-xs text-foreground/50">Kein Produktlink verfügbar</span>
        )}
        <span className="text-[10px] text-foreground/40">
          Hinzugefügt am {new Date(item.createdAt * 1000).toLocaleDateString('de-DE')}
        </span>
      </CardFooter>
    </Card>

    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DialogContent className={'max-w-sm sm:max-w-lg lg:max-w-xl w-11/12 mx-auto bg-card border border-border p-6 rounded-2xl'}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground pr-8 leading-snug">{item.title}</DialogTitle>
          {item.source && (
            <DialogDescription className="flex items-center gap-2 text-accent">
              <Bookmark className="w-4 h-4" />
              {item.source}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Image */}
          {item.image && (
            <div
              className="h-48 w-full max-w-full rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent p-2 flex items-center justify-center"
              onClick={() => setDetailsOpen(true)}
            >
              <img
                src={item.image}
                alt={item.title}
                className="max-h-full max-w-full rounded-lg object-contain border border-border"
                loading="lazy"
              />
            </div>
          )}

          {/* Preis-Übersicht */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {/* Zielpreis - IMMER anzeigen */}
            <Card className="bg-card border border-border text-foreground p-4 shadow-lg">
              <CardHeader className="p-0 pb-2">
                <p className="text-sm text-accent mb-2">Dein Zielpreis</p>
                <p className="text-3xl font-bold leading-tight">
                  {targetPriceEUR !== undefined ? formatEuros(targetPriceEUR) : '—'}
                </p>
                <p className="text-sm text-foreground/70 mt-2">
                  {formatSats(targetPriceSats)} sats
                </p>
              </CardHeader>
              {isReady && (
                <div className="mt-4">
                  <Badge className="bg-success/20 text-success border-success/30 text-sm px-3 py-1">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Ziel erreicht!
                  </Badge>
                </div>
              )}
            </Card>

            {/* Aktueller Preis - nur wenn vorhanden */}
            {currentPriceEUR && (
              <Card className="bg-card border border-border text-foreground p-4">
                <CardHeader className="p-0 pb-2">
                  <p className="text-sm text-foreground/60 mb-2">Aktueller Shop-Preis</p>
                  <p className="text-3xl font-bold leading-tight">
                    {formatEuros(currentPriceEUR)}
                  </p>
                  <p className="text-sm text-foreground/50 mt-2">
                    {currentPriceSats ? `${formatSats(currentPriceSats)} sats` : '—'}
                  </p>
                </CardHeader>
              </Card>
            )}

            {/* Fortschrittsbalken - nur wenn beide Preise vorhanden */}
            {currentPriceSats && targetPriceSats && (
              <Card className="bg-card border border-border text-foreground p-4">
                <CardHeader className="p-0 pb-3">
                  <p className="text-sm text-foreground/60 mb-3">Fortschritt zum Zielpreis</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground/70">
                        {satsDifference > 0 ? 'Benötigte Reduktion' : 'Unterschreitung des Ziels'}
                      </span>
                      <span className="text-2xl font-bold text-accent">
                        {satsDifference > 0
                          ? `${Math.round(percentGapRelativeCurrent)}%`
                          : `${Math.round(Math.abs(percentOvershootRelativeTarget))}%`}
                      </span>
                    </div>
                    <Progress value={progressPercentage ?? 0} className="h-2 rounded-full bg-muted" />
                    <div className="flex justify-between text-sm text-foreground/60">
                      <span>{formatSats(currentPriceSats)} sats</span>
                      <span className={satsDifference < 0 ? "text-success font-semibold" : "text-accent font-semibold"}>
                        {savingsInEuro < 0
                          ? `+${formatEuros(Math.abs(savingsInEuro))}`
                          : `-${formatEuros(savingsInEuro)}`}
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
              <p className="text-xs uppercase text-accent/60 tracking-wider">Notizen</p>
              <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}

          {/* Link */}
          <Button
            variant="default"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            size="lg"
            asChild
          >
            <a href={item.link} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              {item.link ? 'Zum Produkt' : 'Kein Produktlink verfügbar'}
            </a>
          </Button>

          {/* Meta */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-foreground/40 pt-4 border-t border-border mt-6">
            <span>Hinzugefügt am {new Date(item.createdAt * 1000).toLocaleDateString('de-DE')}</span>
            {isReady && (
              <Badge variant="secondary" className="bg-success/20 text-success border-success/30 mt-2 sm:mt-0">
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
