import React, { useState, useEffect, useCallback } from 'react';

// The BeforeInstallPromptEvent is not a standard event type, so we define it here.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWAButton: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (!isStandalone) {
        setInstallPrompt(e as BeforeInstallPromptEvent);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setShowBanner(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem('pwaInstallDismissedUntil');
    if (installPrompt && (!dismissedUntil || new Date().getTime() > Number(dismissedUntil))) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [installPrompt]);

  const handleInstallClick = useCallback(async () => {
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User dismissed the PWA installation');
    }
    setInstallPrompt(null);
    setShowBanner(false);
  }, [installPrompt]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dismiss for 7 days
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('pwaInstallDismissedUntil', String(expiry));
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-fade-in" aria-live="polite">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <img src="/pwa-icon-192.png" alt="App Icon" className="w-10 h-10"/>
                <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Install SakoonApp</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add to home screen for quick access.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <button
                    onClick={handleInstallClick}
                    className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    Install
                </button>
                 <button onClick={handleDismiss} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" aria-label="Dismiss install banner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
    </div>
  );
};

export default InstallPWAButton;