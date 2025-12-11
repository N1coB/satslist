import { Bitcoin, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBitcoinPrice, formatEur } from '@/hooks/useBitcoinPrice';
import { cn } from '@/lib/utils';

export function BitcoinPriceCard() {
  const { data: price, isLoading, error, refetch, isFetching } = useBitcoinPrice();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !price) {
    return (
      <Card className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-background border-destructive/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Bitcoin Preis</p>
              <p className="text-lg font-medium text-destructive">Fehler beim Laden</p>
              <button
                onClick={() => refetch()}
                className="text-sm text-primary hover:underline mt-2 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Erneut versuchen
              </button>
            </div>
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Bitcoin className="h-8 w-8 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = price.change24h >= 0;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 card-hover overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -skew-x-12 transform translate-x-full animate-[shimmer_3s_infinite]" />
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">Bitcoin Preis</p>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
              </button>
            </div>
            <p className="text-3xl font-bold gradient-text">
              {formatEur(price.eur)}
            </p>
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{isPositive ? '+' : ''}{price.change24h.toFixed(2)}% (24h)</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Aktualisiert: {price.lastUpdated.toLocaleTimeString('de-DE')}
            </p>
          </div>
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center bitcoin-glow">
            <Bitcoin className="h-10 w-10 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
