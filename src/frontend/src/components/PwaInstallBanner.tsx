import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { usePwaInstallPrompt } from '../hooks/usePwaInstallPrompt';

export default function PwaInstallBanner() {
  const { isInstallable, isInstalled, bannerDismissed, promptInstall, dismissBanner } = usePwaInstallPrompt();

  // Hide banner if installed, not installable, or dismissed
  if (isInstalled || !isInstallable || bannerDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      // If user dismissed the prompt, hide the banner
      dismissBanner();
    }
  };

  const handleDismiss = () => {
    dismissBanner();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <Download className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Install metube.xyz</p>
          <p className="text-xs text-muted-foreground">Get the app experience on your device</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-shrink-0"
          >
            Install
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="flex-shrink-0 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
