import { ChartLineUp } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WishlistStatsProps {
  count: number;
  readyCount: number;
  totalTarget: number;
}

export function WishlistStats({ count, readyCount, totalTarget }: WishlistStatsProps) {
  return (
    <Card className="side-card bg-gradient-to-br from-orange-500 via-orange-400 to-purple-500 text-white shadow-2xl border-0">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Deine Sats-Vision</CardTitle>
          <ChartLineUp className="w-5 h-5" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1 rounded-2xl border border-white/30 bg-white/5 p-3 text-xs uppercase tracking-[0.3em] text-white/80">
            <p className="text-xs">Ziele</p>
            <p className="text-2xl font-semibold text-white">{count}</p>
          </div>
          <div className="space-y-1 rounded-2xl border border-white/30 bg-white/5 p-3 text-xs uppercase tracking-[0.3em] text-white/80">
            <p className="text-xs">Bereit</p>
            <p className="text-2xl font-semibold text-white">{readyCount}</p>
          </div>
          <div className="space-y-1 rounded-2xl border border-white/30 bg-white/5 p-3 text-xs uppercase tracking-[0.3em] text-white/80">
            <p className="text-xs">Sats gesamt</p>
            <p className="text-2xl font-semibold text-white">{totalTarget.toLocaleString('de-DE')}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
