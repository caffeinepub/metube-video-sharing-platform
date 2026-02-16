import { useState } from 'react';
import { usePwaInstallPrompt } from './usePwaInstallPrompt';

export function useInstallAppEntryPoint() {
  const { isInstallable, isInstalled, promptInstall } = usePwaInstallPrompt();
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  // Show install action when not installed
  const shouldShowInstallAction = !isInstalled;

  // Determine if native prompt is available
  const hasNativePrompt = isInstallable;

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      // Trigger native install prompt
      await promptInstall();
    } else {
      // Show iOS instructions for platforms without native prompt
      setShowIosInstructions(true);
    }
  };

  return {
    shouldShowInstallAction,
    hasNativePrompt,
    handleInstallClick,
    showIosInstructions,
    setShowIosInstructions,
  };
}
