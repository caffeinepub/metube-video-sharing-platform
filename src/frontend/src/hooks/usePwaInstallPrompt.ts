import { useState, useEffect } from 'react';
import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  bannerDismissed: boolean;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setIsInstallable: (installable: boolean) => void;
  setIsInstalled: (installed: boolean) => void;
  setBannerDismissed: (dismissed: boolean) => void;
}

// Shared store for install state
const useInstallStore = create<InstallState>((set) => ({
  deferredPrompt: null,
  isInstallable: false,
  isInstalled: false,
  bannerDismissed: false,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setIsInstallable: (installable) => set({ isInstallable: installable }),
  setIsInstalled: (installed) => set({ isInstalled: installed }),
  setBannerDismissed: (dismissed) => set({ bannerDismissed: dismissed }),
}));

export function usePwaInstallPrompt() {
  const {
    deferredPrompt,
    isInstallable,
    isInstalled,
    bannerDismissed,
    setDeferredPrompt,
    setIsInstallable,
    setIsInstalled,
    setBannerDismissed,
  } = useInstallStore();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, setIsInstallable, setIsInstalled]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
  };

  return {
    isInstallable,
    isInstalled,
    bannerDismissed,
    promptInstall,
    dismissBanner,
  };
}
