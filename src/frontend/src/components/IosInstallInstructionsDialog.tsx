import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share, Plus, Smartphone } from 'lucide-react';

interface IosInstallInstructionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IosInstallInstructionsDialog({
  open,
  onOpenChange,
}: IosInstallInstructionsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install metube.xyz</DialogTitle>
          <DialogDescription>
            Add metube.xyz to your home screen for the best experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <span className="text-sm font-semibold text-primary">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Open the Share menu</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap the <Share className="inline h-3 w-3 mx-0.5" /> Share button in your browser
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <span className="text-sm font-semibold text-primary">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Add to Home Screen</p>
              <p className="text-xs text-muted-foreground mt-1">
                Scroll down and tap <Plus className="inline h-3 w-3 mx-0.5" /> "Add to Home Screen"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
              <span className="text-sm font-semibold text-primary">3</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Confirm installation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tap "Add" to install metube.xyz on your device
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 flex items-start gap-2">
            <Smartphone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Once installed, you can launch metube.xyz from your home screen like any other app
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
