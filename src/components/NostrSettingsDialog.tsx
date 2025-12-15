import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RelayListManager } from '@/components/RelayListManager';
import { cn } from '@/lib/utils';

interface NostrSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NostrSettingsDialog({ open, onOpenChange }: NostrSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] w-full bg-black/80 border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Nostr Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-1 text-sm text-white">
          <p>
            Hier kannst du deine Relay-Liste anpassen, Schreib- und Leserechte verwalten sowie
            prüfen, welche Relays deine Wunschliste aktuell lesen bzw. speichern.
          </p>
          <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
            <RelayListManager />
          </div>
          <p className="text-xs text-white/60">
            Tritt noch kein Event auf? Prüfe, ob deine Nostr-Wallet (z. B. Alby) Lese-Schreibrechte auf
            den ausgewählten Relays erlaubt. Alby zeigt in der Regel eine Bestätigung an – aktiviere
            sie explizit, wenn du neue Relays hinzufügst.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
