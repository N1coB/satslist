import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface NotificationState {
  supported: boolean;
  permission: NotificationPermission;
  requested: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    supported: false,
    permission: 'default',
    requested: false,
  });
  const [, setNotificationRequested] = useLocalStorage('notification-requested', false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window;

    setState((prev) => ({
      ...prev,
      supported,
      permission: supported ? Notification.permission : 'denied',
    }));
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!state.supported) {
      console.warn('Notifications not supported');
      return false;
    }

    if (state.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({
        ...prev,
        permission,
        requested: true,
      }));
      setNotificationRequested(true);

      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions): Notification | null => {
    if (state.permission !== 'granted' || !state.supported) {
      console.warn('Cannot send notification: permission not granted');
      return null;
    }

    try {
      return new Notification(title, {
        icon: '/satslist/favicon.ico',
        tag: 'satslist-notification',
        badge: '/satslist/favicon.ico',
        ...options,
      });
    } catch (error) {
      console.error('Send notification error:', error);
      return null;
    }
  };

  const notifyTargetReached = (productName: string): void => {
    sendNotification(`🎉 ${productName}`, {
      body: 'Dein Zielpreis wurde erreicht! Zeit zum Kaufen!',
      tag: `target-reached-${productName}`,
    });
  };

  const notifyProductAdded = (productName: string): void => {
    sendNotification(`✅ ${productName}`, {
      body: 'wurde zu deiner Wunschliste hinzugefügt',
      tag: 'product-added',
    });
  };

  return {
    ...state,
    requestPermission,
    sendNotification,
    notifyTargetReached,
    notifyProductAdded,
  };
}
