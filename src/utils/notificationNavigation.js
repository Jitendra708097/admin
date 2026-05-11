const DEFAULT_NOTIFICATION_ROUTE = '/notifications';

const WEB_ROUTE_ALIASES = {
  '/home': '/dashboard',
  '/attendance': '/attendance',
  '/attendance/live': '/attendance/live',
  '/history': '/attendance',
  '/leave': '/leaves',
  '/leaves': '/leaves',
  '/regularisation': '/regularisations',
  '/regularisations': '/regularisations',
  '/device-exception': '/device-exceptions',
  '/device-exceptions': '/device-exceptions',
  '/employees': '/employees',
  '/branches': '/branches',
  '/shifts': '/shifts',
  '/profile': '/settings',
  '/settings': '/settings',
  '/billing': '/billing',
  '/reports': '/reports',
  '/notifications': '/notifications',
};

const TYPE_ROUTE_MAP = {
  leave_request: '/leaves',
  leave_request_submitted: '/leaves',
  leave_approved: '/leaves',
  leave_rejected: '/leaves',
  leave_cancelled: '/leaves',
  regularisation_request: '/regularisations',
  regularisation_submitted: '/regularisations',
  regularisation_approved: '/regularisations',
  regularisation_rejected: '/regularisations',
  device_exception_requested: '/device-exceptions',
  device_exception_approved: '/device-exceptions',
  device_exception_rejected: '/device-exceptions',
  checkin_reminder: '/attendance',
  checkout_reminder: '/attendance',
  attendance_marked: '/attendance',
  attendance_anomaly: '/attendance',
  late_marked: '/attendance',
  absent_marked: '/attendance',
  face_enrollment: '/employees',
  face_enrollment_complete: '/employees',
  new_employee_onboarded: '/employees',
  billing_alert: '/billing',
  report_generated: '/reports',
  report_failed: '/reports',
  branch_updated: '/branches',
  branch_geofence_changed: '/branches',
  shift_changed: '/shifts',
  general: '/notifications',
};

const TYPE_CATEGORY_MAP = {
  leave_request: 'leave',
  leave_request_submitted: 'leave',
  leave_approved: 'leave',
  leave_rejected: 'leave',
  leave_cancelled: 'leave',
  regularisation_request: 'regularisation',
  regularisation_submitted: 'regularisation',
  regularisation_approved: 'regularisation',
  regularisation_rejected: 'regularisation',
  device_exception_requested: 'device_exception',
  device_exception_approved: 'device_exception',
  device_exception_rejected: 'device_exception',
  checkin_reminder: 'attendance',
  checkout_reminder: 'attendance',
  attendance_marked: 'attendance',
  attendance_anomaly: 'attendance',
  late_marked: 'attendance',
  absent_marked: 'attendance',
  face_enrollment: 'employee',
  face_enrollment_complete: 'employee',
  new_employee_onboarded: 'employee',
  billing_alert: 'billing',
  report_generated: 'report',
  report_failed: 'report',
  branch_updated: 'system',
  branch_geofence_changed: 'system',
  shift_changed: 'system',
  general: 'system',
};

const TYPE_PRIORITY_MAP = {
  attendance_anomaly: 'critical',
  device_exception_requested: 'critical',
  billing_alert: 'critical',
  absent_marked: 'high',
  leave_request_submitted: 'high',
  regularisation_submitted: 'high',
  regularisation_request: 'high',
  leave_request: 'high',
  late_marked: 'normal',
  checkout_reminder: 'normal',
  checkin_reminder: 'normal',
  report_failed: 'normal',
  report_generated: 'low',
  branch_geofence_changed: 'normal',
  branch_updated: 'low',
  shift_changed: 'normal',
  face_enrollment: 'low',
  face_enrollment_complete: 'low',
  new_employee_onboarded: 'low',
  general: 'low',
};

const TYPE_STATUS_MAP = {
  leave_request: 'action_needed',
  leave_request_submitted: 'action_needed',
  regularisation_request: 'action_needed',
  regularisation_submitted: 'action_needed',
  device_exception_requested: 'action_needed',
  leave_approved: 'approved',
  regularisation_approved: 'approved',
  device_exception_approved: 'approved',
  leave_rejected: 'rejected',
  regularisation_rejected: 'rejected',
  device_exception_rejected: 'rejected',
  leave_cancelled: 'cancelled',
  report_failed: 'failed',
  report_generated: 'completed',
  branch_geofence_changed: 'completed',
  branch_updated: 'completed',
  shift_changed: 'completed',
};

function getNotificationData(notificationOrUrl) {
  if (!notificationOrUrl || typeof notificationOrUrl !== 'object') {
    return {};
  }

  return notificationOrUrl.data || {};
}

function appendRequestId(route, requestId, extraParams = {}) {
  if (!route || !requestId) {
    return route;
  }

  const [pathname, search = ''] = route.split('?');
  const params = new URLSearchParams(search);

  if (!params.has('requestId')) {
    params.set('requestId', requestId);
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && !params.has(key)) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function enrichRouteWithNotificationData(route, notificationOrUrl) {
  const data = getNotificationData(notificationOrUrl);
  const type = getNotificationType(notificationOrUrl);

  if (route.startsWith('/leaves')) {
    const leaveId = data.leave_id || data.leaveId || data.requestId;
    const view = type === 'leave_request_submitted' || type === 'leave_request' ? 'pending' : undefined;
    return appendRequestId(route, leaveId, view ? { view } : undefined);
  }

  if (route.startsWith('/regularisations')) {
    return appendRequestId(route, data.regularisation_id || data.regularisationId || data.requestId);
  }

  if (route.startsWith('/device-exceptions')) {
    return appendRequestId(route, data.exception_id || data.exceptionId || data.requestId);
  }

  if (route.startsWith('/attendance')) {
    const attendanceId = data.attendance_id || data.attendanceId || data.requestId;
    const employeeId = data.employee_id || data.employeeId || data.emp_id || data.empId;
    const date = data.date || data.attendanceDate;
    return appendRequestId(route, attendanceId, {
      employeeId,
      date,
    });
  }

  if (route.startsWith('/employees')) {
    const employeeId = data.employee_id || data.employeeId || data.emp_id || data.empId;
    return employeeId ? `/employees/${encodeURIComponent(employeeId)}` : route;
  }

  if (route.startsWith('/reports')) {
    return appendRequestId(route, data.report_id || data.reportId || data.requestId);
  }

  return route;
}

function normalizeWebRoute(path) {
  if (!path || typeof path !== 'string') {
    return null;
  }

  const target = path.trim();
  if (!target) {
    return null;
  }

  const [pathname, search = ''] = target.split('?');
  const normalizedPath = WEB_ROUTE_ALIASES[pathname] || pathname;

  if (!normalizedPath.startsWith('/')) {
    return null;
  }

  return `${normalizedPath}${search ? `?${search}` : ''}`;
}

function resolveDeepLink(target) {
  if (!target.startsWith('attendease://')) {
    return null;
  }

  const path = target.replace('attendease://', '');
  const [screen, id] = path.split('/');

  switch (screen) {
    case 'attendance':
    case 'checkout':
      return '/attendance';
    case 'leave':
      return id ? `/leaves?requestId=${encodeURIComponent(id)}` : '/leaves';
    case 'regularise':
    case 'regularisation':
      return id ? `/regularisations?requestId=${encodeURIComponent(id)}` : '/regularisations';
    case 'device-exception':
      return id ? `/device-exceptions?requestId=${encodeURIComponent(id)}` : '/device-exceptions';
    case 'profile':
      return '/settings';
    default:
      return null;
  }
}

function getNotificationActionUrl(notificationOrUrl) {
  if (typeof notificationOrUrl === 'string') {
    return notificationOrUrl;
  }

  if (!notificationOrUrl || typeof notificationOrUrl !== 'object') {
    return '';
  }

  return notificationOrUrl.actionUrl
    || notificationOrUrl.action_url
    || notificationOrUrl.data?.actionUrl
    || notificationOrUrl.data?.action_url
    || '';
}

function getNotificationType(notificationOrUrl) {
  if (!notificationOrUrl || typeof notificationOrUrl !== 'object') {
    return '';
  }

  return notificationOrUrl.type || notificationOrUrl.data?.type || '';
}

export function resolveNotificationTarget(notificationOrUrl) {
  const actionUrl = getNotificationActionUrl(notificationOrUrl);
  const target = typeof actionUrl === 'string' ? actionUrl.trim() : '';

  if (target) {
    const deepLinkRoute = resolveDeepLink(target);
    if (deepLinkRoute) {
      return enrichRouteWithNotificationData(deepLinkRoute, notificationOrUrl);
    }

    const webRoute = normalizeWebRoute(target);
    if (webRoute) {
      return enrichRouteWithNotificationData(webRoute, notificationOrUrl);
    }
  }

  const typeRoute = TYPE_ROUTE_MAP[getNotificationType(notificationOrUrl)];
  return typeRoute ? enrichRouteWithNotificationData(typeRoute, notificationOrUrl) : DEFAULT_NOTIFICATION_ROUTE;
}

export function getNotificationCategory(notificationOrType) {
  const type = typeof notificationOrType === 'string' ? notificationOrType : getNotificationType(notificationOrType);
  return notificationOrType?.category || TYPE_CATEGORY_MAP[type] || 'system';
}

export function getNotificationPriority(notificationOrType) {
  if (notificationOrType && typeof notificationOrType === 'object' && notificationOrType.priority) {
    return notificationOrType.priority;
  }

  const type = typeof notificationOrType === 'string' ? notificationOrType : getNotificationType(notificationOrType);
  return TYPE_PRIORITY_MAP[type] || 'normal';
}

export function getNotificationStatus(notificationOrType) {
  if (notificationOrType && typeof notificationOrType === 'object' && notificationOrType.status) {
    return notificationOrType.status;
  }

  const type = typeof notificationOrType === 'string' ? notificationOrType : getNotificationType(notificationOrType);
  return TYPE_STATUS_MAP[type] || 'info';
}

export function getNotificationActionLabel(notificationOrType) {
  const category = getNotificationCategory(notificationOrType);
  const status = getNotificationStatus(notificationOrType);

  if (status === 'action_needed') {
    return 'Review';
  }

  if (category === 'billing') {
    return 'View Billing';
  }

  if (category === 'attendance') {
    return 'View Attendance';
  }

  if (category === 'employee') {
    return 'View Employee';
  }

  if (category === 'report') {
    return 'View Report';
  }

  return 'Open';
}

export { DEFAULT_NOTIFICATION_ROUTE };
