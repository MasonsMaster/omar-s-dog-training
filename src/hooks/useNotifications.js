import { useEffect, useState } from 'react';
import { requestNotificationPermission, saveFCMToken, onForegroundMessage } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(Notification.permission);
  const [isSupported, setIsSupported] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setIsSupported(false);
      return;
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(err => {
        console.warn('Service worker registration failed:', err);
      });
    }

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Notification received:', payload);
    });

    return unsubscribe;
  }, []);

  const requestPermission = async () => {
    if (!user) return false;

    const newToken = await requestNotificationPermission();
    if (newToken) {
      setToken(newToken);
      setPermission(Notification.permission);
      await saveFCMToken(user.email, newToken);
      return true;
    }
    return false;
  };

  const disableNotifications = async () => {
    // User would need to disable in browser settings
    // We can't programmatically revoke permissions
    setPermission('denied');
  };

  return {
    isSupported,
    permission,
    token,
    requestPermission,
    disableNotifications,
    isEnabled: permission === 'granted',
  };
}