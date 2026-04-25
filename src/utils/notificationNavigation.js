const DEFAULT_NOTIFICATION_ROUTE = '/notifications';

export function resolveNotificationTarget(actionUrl) {
  if (typeof actionUrl !== 'string') {
    return DEFAULT_NOTIFICATION_ROUTE;
  }

  const target = actionUrl.trim();

  if (!target || !target.startsWith('/')) {
    return DEFAULT_NOTIFICATION_ROUTE;
  }

  return target;
}

export { DEFAULT_NOTIFICATION_ROUTE };
