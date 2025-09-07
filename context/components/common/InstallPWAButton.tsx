import React, { useState, useEffect, useCallback } from 'react';

// The BeforeInstallPromptEvent is not a standard event type, so we define it here for clarity.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWAButton: React.FC = () => {
  // State to hold the event that triggers the install prompt.
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // This function handles the browser's 'beforeinstallprompt' event.
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile.
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for the event.
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // This function is called when the PWA is successfully installed.
    const handleAppInstalled = () => {
      // Clear the deferredPrompt so the banner doesn't show again.
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup listeners when the component unmounts.
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // This function is triggered when the user clicks the "Install" button.
  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) {
      // If the prompt isn't available, do nothing.
      return;
    }
    
    // Show the native installation prompt.
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt.
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User dismissed the PWA installation');
    }

    // The prompt can only be used once, so we clear it.
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Hides the banner for the current session if dismissed.
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeferredPrompt(null);
  };
  
  // Check if the app is already running in standalone mode (installed).
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  // Don't show the button if the prompt isn't ready or if the app is already installed.
  if (!deferredPrompt || isStandalone) {
    return null;
  }

  // Render the installation banner.
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
                    className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
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
