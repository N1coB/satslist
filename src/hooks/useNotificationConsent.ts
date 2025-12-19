const CONSENT_KEY = 'satslist-notification-consent';
const NOTIFIED_KEY = 'satslist-notified-items';

export function getNotificationConsent(): NotificationPermission {
  try {
    if (typeof window === 'undefined') return 'default';
    return (localStorage.getItem(CONSENT_KEY) as NotificationPermission) ?? Notification.permission ?? 'default';
  } catch {
    return Notification.permission ?? 'default';
  }
}

export function setNotificationConsent(value: NotificationPermission) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // ignore
  }
}

export function loadNotifiedIds(): Set<string> {
  try {
    if (typeof window === 'undefined') return new Set();
    const stored = localStorage.getItem(NOTIFIED_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function persistNotifiedIds(ids: Set<string>) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}
