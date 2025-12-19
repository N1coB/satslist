import { Target, CheckCircle2, Coins } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { formatSats } from '@/lib/format';

interface WishlistStatsProps {
  count: number;
  readyCount: number;
  totalTarget: number;
}

export function WishlistStats({ count, readyCount, totalTarget }: WishlistStatsProps) {
  return (
    <Card className="bg-card border border-border shadow-lg">
      <CardHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-accent/30 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xs text-foreground/80 uppercase tracking-wide">Ziele</p>
              <p className="text-2xl font-bold text-foreground">{count}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-success/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-xs text-foreground/80 uppercase tracking-wide">Erreicht</p>
              <p className="text-2xl font-bold text-foreground">{readyCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-info/30 flex items-center justify-center flex-shrink-0">
              <Coins className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-xs text-foreground/80 uppercase tracking-wide">Gesamt</p>
              <p className="text-lg font-bold text-foreground">{formatSats(totalTarget)} <span className="text-sm text-foreground/70">sats</span></p>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
