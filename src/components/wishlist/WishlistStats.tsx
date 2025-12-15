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
    <Card className="bg-white/5 border-white/20 shadow-lg">
      <CardHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-orange-500/30 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-orange-300" />
            </div>
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wide">Ziele</p>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-green-500/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wide">Erreicht</p>
              <p className="text-2xl font-bold text-white">{readyCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Coins className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wide">Gesamt</p>
              <p className="text-lg font-bold text-white">{formatSats(totalTarget)} <span className="text-sm text-white/70">sats</span></p>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
