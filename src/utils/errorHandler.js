/**
 * @module errorHandler
 * @description Parse API error codes to user-friendly messages.
 *              Enhanced 2026-04-14: Added error logging, helper functions for recovery,
 *              and semantic error categorization for better UX.
 */

// Error log storage (session-scoped)
const ERROR_LOG = [];
const MAX_ERROR_LOG_SIZE = 100;

const ERROR_MESSAGES = {
  AUTH_001: 'Invalid email or password.',
  AUTH_006: 'Your account has been suspended.',
  AUTH_007: 'Your organisation account has been suspended.',
  AUTH_009: 'Check-in from unregistered device.',
  AUTH_014: 'The OTP is invalid or expired. Please request a new one.',
  AUTH_015: 'Password reset email is not configured right now. Please contact support.',
  AUTH_016: 'Too many reset requests. Please wait a little and try again.',
  AUTH_017: 'Too many reset attempts. Please wait a little and try again.',
  AUTH_018: 'Please wait a minute before requesting another OTP.',
  EMP_002: 'An employee with this email already exists.',
  ATT_003: 'This employee already has an open session.',
  GEO_003: 'Employee is outside office premises.',
  GEN_001: 'Something went wrong. Please try again.',
};

/**
 * Logs an error for debugging
 * @param {string} code - Error code
 * @param {Object} error - Error object
 * @param {Object} context - Context {action, component, timestamp}
 */
export const logError = (code, error, context = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    code,
    message: error?.message || ERROR_MESSAGES[code] || 'Unknown error',
    url: error?.config?.url || null,
    status: error?.status || null,
    ...context,
  };

  ERROR_LOG.push(logEntry);
  
  // Keep log size manageable
  if (ERROR_LOG.length > MAX_ERROR_LOG_SIZE) {
    ERROR_LOG.shift();
  }

  // Log to console in development
  console.error(`[${code}] ${logEntry.message}`, {
    url: logEntry.url,
    status: logEntry.status,
    context,
  });
};

/**
 * Gets the error log
 * @returns {Array} Array of error log entries
 */
export const getErrorLog = () => {
  return ERROR_LOG.slice();
};

/**
 * Clears the error log
 */
export const clearErrorLog = () => {
  ERROR_LOG.length = 0;
};

/**
 * Parses API error to user-friendly message
 * @param {Object} error - Error object from RTK Query
 * @returns {string} Parsed error message
 */
export const parseApiError = (error) => {
  const code = error?.data?.error?.code;
  if (ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  if (error?.data?.error?.message) {
    return error.data.error.message;
  }

  if (error?.data?.message) {
    return error.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (!error?.status) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  return 'Something went wrong.';
};

/**
 * Parses API error and logs it
 * @param {Object} error - Error object from RTK Query
 * @param {Object} context - Context {action, component}
 * @returns {string} Parsed error message
 */
export const parseApiErrorWithLog = (error, context = {}) => {
  const code = error?.data?.error?.code || 'UNKNOWN';
  const message = parseApiError(error);
  
  logError(code, error, context);
  
  return message;
};

/**
 * Checks if error is authentication-related
 * @param {Object} error - Error object
 * @returns {boolean}
 */
export const isAuthError = (error) => {
  const code = error?.data?.error?.code;
  return code?.startsWith('AUTH_');
};

/**
 * Checks if error is permission-related
 * @param {Object} error - Error object
 * @returns {boolean}
 */
export const isPermissionError = (error) => {
  return error?.status === 403;
};

/**
 * Checks if error is a network error
 * @param {Object} error - Error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return !error?.status || error?.status >= 500;
};

/**
 * Suggests recovery action based on error type
 * @param {Object} error - Error object
 * @returns {Object} {action: string, label: string, handler: function}
 */
export const getErrorRecovery = (error) => {
  if (isAuthError(error)) {
    return {
      action: 'redirect-login',
      label: 'Log In Again',
    };
  }
  
  if (isPermissionError(error)) {
    return {
      action: 'contact-admin',
      label: 'Contact Your Admin',
    };
  }
  
  if (isNetworkError(error)) {
    return {
      action: 'retry',
      label: 'Retry',
    };
  }
  
  return {
    action: 'dismiss',
    label: 'Dismiss',
  };
};
