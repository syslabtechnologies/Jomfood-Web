import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { toast } from '../../utils/toast';
import {
  subscribePWAInstallPrompt,
  triggerPWAInstallPrompt,
} from '../../utils/pwaInstallPrompt';

const PWAInstallButton = ({ mobile = false }) => {
  const [deferredPromptAvailable, setDeferredPromptAvailable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribePWAInstallPrompt((state) => {
      setDeferredPromptAvailable(state.deferredPromptAvailable);
      setIsInstalled(state.isInstalled);
    });
    return unsubscribe;
  }, []);

  const handleInstallClick = async () => {
    const result = await triggerPWAInstallPrompt();
    if (!result.ok && result.reason === 'unavailable') {
      toast.error('Install prompt not available');
      return;
    }

    if (result.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  if (isInstalled || !deferredPromptAvailable) return null;

  if (mobile) {
    return (
      <button
        onClick={handleInstallClick}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 hover:border-primary/30 hover:bg-primary-50 hover:text-primary transition-colors"
        aria-label="Install JomFood Web App"
      >
        <span className="inline-flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>Install Web App</span>
        </span>
        <span className="text-xs text-gray-500">PWA</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-primary transition-colors text-xs sm:text-sm font-medium"
      aria-label="Install JomFood App"
    >
      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
      <span className="sm:inline text-[9px] sm:text-sm">Install App</span>
    </button>
  );
};

export default PWAInstallButton;

