import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Download, X, Bell, BellOff } from 'lucide-react';
import api from './api';

// Register service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Convert URL-safe base64 to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Hook to manage push notifications
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check if push is supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/push/status');
      setIsSubscribed(response.data.subscribed);
    } catch (error) {
      console.error('Failed to check push status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!isSupported) return false;

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }

      // Get VAPID public key from server
      const vapidResponse = await api.get('/push/vapid-public-key');
      const vapidPublicKey = vapidResponse.data.publicKey;

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      const subscriptionJson = subscription.toJSON();
      await api.post('/push/subscribe', {
        subscription: {
          endpoint: subscriptionJson.endpoint,
          keys: subscriptionJson.keys
        }
      });

      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe locally
        await subscription.unsubscribe();
        
        // Remove from server
        await api.delete(`/push/unsubscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`);
      }
      
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      return false;
    }
  };

  const sendTestNotification = async () => {
    try {
      await api.post('/push/test');
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

// Hook to manage PWA install prompt
export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show banner after a delay
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return false;

    const result = await installPrompt.prompt();
    console.log('Install prompt result:', result.outcome);
    
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setShowBanner(false);
    }
    
    setInstallPrompt(null);
    return result.outcome === 'accepted';
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    showBanner,
    install,
    dismiss
  };
};

// Install Banner Component
export const PWAInstallBanner = () => {
  const { canInstall, showBanner, install, dismiss } = usePWAInstall();

  if (!canInstall || !showBanner) return null;

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-fade-in"
      data-testid="pwa-install-banner"
    >
      <div className="bg-card border rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Installer RentMaestro
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              Installez l'application pour un accès rapide et une utilisation hors ligne.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={install} className="flex-1">
                Installer
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Plus tard
              </Button>
            </div>
          </div>
          <button 
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Offline indicator component
export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 text-sm font-medium"
      data-testid="offline-indicator"
    >
      Mode hors ligne - Certaines fonctionnalités peuvent être limitées
    </div>
  );
};

export default { registerServiceWorker, usePWAInstall, PWAInstallBanner, OfflineIndicator };
