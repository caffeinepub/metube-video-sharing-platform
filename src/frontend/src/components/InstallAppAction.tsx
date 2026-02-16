import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useInstallAppEntryPoint } from '../hooks/useInstallAppEntryPoint';
import IosInstallInstructionsDialog from './IosInstallInstructionsDialog';

interface InstallAppActionProps {
  variant?: 'button' | 'menu-item';
  onActionComplete?: () => void;
}

export default function InstallAppAction({
  variant = 'button',
  onActionComplete,
}: InstallAppActionProps) {
  const {
    shouldShowInstallAction,
    handleInstallClick,
    showIosInstructions,
    setShowIosInstructions,
  } = useInstallAppEntryPoint();

  if (!shouldShowInstallAction) {
    return null;
  }

  const handleClick = async () => {
    await handleInstallClick();
    onActionComplete?.();
  };

  if (variant === 'menu-item') {
    return (
      <>
        <Button
          variant="ghost"
          className="justify-start touch-target h-12 w-full"
          onClick={handleClick}
        >
          <Download className="mr-2 h-5 w-5" />
          Install App
        </Button>

        <IosInstallInstructionsDialog
          open={showIosInstructions}
          onOpenChange={setShowIosInstructions}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="touch-target"
      >
        <Download className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Install App</span>
      </Button>

      <IosInstallInstructionsDialog
        open={showIosInstructions}
        onOpenChange={setShowIosInstructions}
      />
    </>
  );
}
