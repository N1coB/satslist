import { useCallback, useEffect, useState } from 'react';

type NotificationPermissionState = NotificationPermission | 'unsupported';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return 'unsupported';
    }

    return Notification.permission;
  });

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      return 'unsupported' as NotificationPermissionState;
    }

    const next = await Notification.requestPermission();
    setPermission(next);
    return next;
  }, []);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission !== 'granted') return;

      new Notification(title, options);
    },
    []
  );

  return {
    permission,
    requestPermission,
    notify,
  };
}
