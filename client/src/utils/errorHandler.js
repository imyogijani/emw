import { toast } from 'react-toastify';

// Enhanced toast configuration for different error types
const TOAST_CONFIG = {
  error: {
    position: 'top-right',
    autoClose: 6000, // Longer duration for errors
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'error-toast',
    bodyClassName: 'error-toast-body',
    progressClassName: 'error-toast-progress'
  },
  warning: {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'warning-toast',
    bodyClassName: 'warning-toast-body',
    progressClassName: 'warning-toast-progress'
  },
  success: {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'success-toast',
    bodyClassName: 'success-toast-body',
    progressClassName: 'success-toast-progress'
  },
  info: {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: 'info-toast',
    bodyClassName: 'info-toast-body',
    progressClassName: 'info-toast-progress'
  }
};

// Error types for better categorization
const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// HTTP status code to error type mapping
const STATUS_CODE_MAP = {
  400: ERROR_TYPES.VALIDATION,
  401: ERROR_TYPES.AUTHENTICATION,
  403: ERROR_TYPES.AUTHORIZATION,
  404: ERROR_TYPES.CLIENT,
  408: ERROR_TYPES.TIMEOUT,
  422: ERROR_TYPES.VALIDATION,
  429: ERROR_TYPES.CLIENT,
  500: ERROR_TYPES.SERVER,
  502: ERROR_TYPES.SERVER,
  503: ERROR_TYPES.SERVER,
  504: ERROR_TYPES.TIMEOUT
};

/**
 * Formats error message with additional context for debugging
 * @param {Error|Object} error - The error object
 * @param {string} context - Additional context about where the error occurred
 * @param {Object} metadata - Additional metadata for debugging
 * @returns {Object} Formatted error object
 */
export const formatError = (error, context = '', metadata = {}) => {
  const timestamp = new Date().toISOString();
  const errorType = getErrorType(error);
  
  // Extract error details
  const errorDetails = {
    message: getErrorMessage(error),
    type: errorType,
    context,
    timestamp,
    metadata,
    statusCode: error?.response?.status || null,
    requestUrl: error?.config?.url || null,
    requestMethod: error?.config?.method?.toUpperCase() || null
  };

  // Add stack trace in development
  if (import.meta.env.DEV) {
    errorDetails.stack = error?.stack || null;
    errorDetails.fullError = error;
  }

  return errorDetails;
};

/**
 * Determines the error type based on the error object
 * @param {Error|Object} error - The error object
 * @returns {string} Error type
 */
const getErrorType = (error) => {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  // Network errors (no response)
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return ERROR_TYPES.NETWORK;
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT;
  }
  
  // HTTP status code based errors
  if (error.response?.status) {
    return STATUS_CODE_MAP[error.response.status] || ERROR_TYPES.SERVER;
  }
  
  return ERROR_TYPES.UNKNOWN;
};

/**
 * Extracts a user-friendly error message from the error object
 * @param {Error|Object} error - The error object
 * @returns {string} User-friendly error message
 */
const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // API response error messages
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Validation errors
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (typeof errors === 'object') {
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0) {
        return errorMessages.join(', ');
      }
    }
  }
  
  // Network specific messages
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return 'Unable to connect to server. Please check your internet connection.';
  }
  
  // Timeout messages
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // HTTP status based messages
  if (error.response?.status) {
    const status = error.response.status;
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'Request timed out. Please try again.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 502:
        return 'Server is temporarily unavailable. Please try again later.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      case 504:
        return 'Server response timed out. Please try again.';
      default:
        return `Server error (${status}). Please try again later.`;
    }
  }
  
  // Fallback to error message or generic message
  return error.message || 'An unexpected error occurred';
};

/**
 * Shows an error toast with enhanced formatting and debugging info
 * @param {Error|Object|string} error - The error to display
 * @param {string} context - Additional context about where the error occurred
 * @param {Object} metadata - Additional metadata for debugging
 * @param {string} errorCode - Specific error code for debugging
 */
export const showErrorToast = (error, context = '', metadata = {}) => {
  const formattedError = typeof error === 'string' 
    ? { message: error, type: ERROR_TYPES.CLIENT, context, metadata }
    : formatError(error, context, metadata);
  
  // Log error for debugging
  console.group(`🚨 Error: ${formattedError.type}`);
  console.error('Message:', formattedError.message);
  console.error('Context:', formattedError.context);
  console.error('Timestamp:', formattedError.timestamp);
  if (formattedError.statusCode) {
    console.error('Status Code:', formattedError.statusCode);
  }
  if (formattedError.requestUrl) {
    console.error('Request URL:', formattedError.requestUrl);
    console.error('Request Method:', formattedError.requestMethod);
  }
  if (Object.keys(formattedError.metadata).length > 0) {
    console.error('Metadata:', formattedError.metadata);
  }
  if (import.meta.env.DEV && formattedError.stack) {
    console.error('Stack Trace:', formattedError.stack);
  }
  console.groupEnd();
  
  // Create user-friendly message with debugging info
  let displayMessage = formattedError.message;
  
  // Add context if provided
  if (context) {
    displayMessage = `${context}: ${displayMessage}`;
  }
  
  // Add debugging info in development
  if (import.meta.env.DEV) {
    displayMessage += `\n\n🔍 Debug Info:\n`;
    displayMessage += `Type: ${formattedError.type}\n`;
    displayMessage += `Time: ${new Date(formattedError.timestamp).toLocaleTimeString()}\n`;
    
    if (formattedError.statusCode) {
      displayMessage += `Status: ${formattedError.statusCode}\n`;
    }
    
    if (formattedError.requestUrl) {
      displayMessage += `URL: ${formattedError.requestMethod} ${formattedError.requestUrl}\n`;
    }
  }
  
  toast.error(displayMessage, TOAST_CONFIG.error);
};

/**
 * Shows a warning toast with enhanced formatting
 * @param {string} message - The warning message
 * @param {string} context - Additional context
 */
export const showWarningToast = (message, context = '') => {
  const displayMessage = context ? `${context}: ${message}` : message;
  toast.warning(displayMessage, TOAST_CONFIG.warning);
};

/**
 * Shows a success toast with enhanced formatting
 * @param {string} message - The success message
 * @param {string} context - Additional context
 */
export const showSuccessToast = (message, context = '') => {
  const displayMessage = context ? `${context}: ${message}` : message;
  toast.success(displayMessage, TOAST_CONFIG.success);
};

/**
 * Shows an info toast with enhanced formatting
 * @param {string} message - The info message
 * @param {string} context - Additional context
 */
export const showInfoToast = (message, context = '') => {
  const displayMessage = context ? `${context}: ${message}` : message;
  toast.info(displayMessage, TOAST_CONFIG.info);
};

/**
 * Handles API errors with automatic retry logic
 * @param {Error} error - The API error
 * @param {string} context - Context about the failed operation
 * @param {Function} retryFunction - Function to retry the operation
 * @param {Object} options - Additional options
 */
export const handleApiError = async (error, context = '', retryFunction = null, options = {}) => {
  const { showRetryButton = false, maxRetries = 3, retryDelay = 1000 } = options;
  
  const formattedError = formatError(error, context);
  const errorCode = error.response?.data?.errorCode;
  
  console.error('API Error:', {
    type: formattedError.type,
    message: formattedError.message,
    status: error.response?.status,
    errorCode: errorCode,
    data: error.response?.data,
    url: error.config?.url,
    method: error.config?.method,
    timestamp: new Date().toISOString()
  });
  
  // Show error toast
  showErrorToast(error, context);
  
  // Handle specific error types
  switch (formattedError.type) {
    case ERROR_TYPES.AUTHENTICATION:
      // Handle specific authentication error codes
      switch (errorCode) {
        case 'TOKEN_EXPIRED':
          console.log('Token expired, redirecting to login');
          showErrorToast('Your session has expired. Please log in again.', 'Authentication');
          break;
        case 'INVALID_TOKEN':
        case 'NO_TOKEN':
        case 'NO_AUTH_HEADER':
        case 'INVALID_AUTH_FORMAT':
          console.log('Invalid authentication, redirecting to login');
          showErrorToast('Authentication failed. Please log in again.', 'Authentication');
          break;
        case 'JWT_SECRET_MISSING':
          console.error('Server configuration error - JWT_SECRET missing');
          showErrorToast('Server configuration error. Please contact support.', 'Server Error');
          return formattedError;
        default:
          showErrorToast('Authentication required. Please log in.', 'Authentication');
      }
      
      // Clear authentication data for all auth errors except server config errors
      if (errorCode !== 'JWT_SECRET_MISSING') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        localStorage.removeItem('onboardingStatus');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          const publicPaths = ['/', '/menu', '/offer', '/shops', '/product', '/login', '/register', '/pricing'];
          const currentPath = window.location.pathname;
          const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
          
          if (!isPublicPath) {
            window.location.href = '/login?reason=session_expired';
          }
        }, 1500);
      }
      break;
      
    case ERROR_TYPES.NETWORK:
      // Handle network errors with better messaging
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        showErrorToast('Unable to connect to server. Please check your internet connection.', 'Network Error');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        showErrorToast('Request timed out. Please try again.', 'Timeout Error');
      }
      
      // Retry logic for network errors
      if (retryFunction && maxRetries > 0) {
        console.log(`Retrying request... (${maxRetries} attempts left)`);
        setTimeout(() => {
          retryFunction(maxRetries - 1);
        }, retryDelay);
      }
      break;
      
    case ERROR_TYPES.TIMEOUT:
      // Show retry option for timeout errors
      if (retryFunction && showRetryButton) {
        // Implementation for retry button would go here
        // This could be enhanced with a custom toast component
      }
      break;
      
    case ERROR_TYPES.SERVER:
      // Handle server errors with specific messaging
      if (error.response?.status === 503) {
        showErrorToast('Service temporarily unavailable. Please try again later.', 'Server Error');
      } else if (error.response?.status === 502 || error.response?.status === 504) {
        showErrorToast('Server is temporarily unavailable. Please try again.', 'Server Error');
      }
      break;
      
    default:
      // Handle other error types as needed
      break;
  }
  
  return {
    ...formattedError,
    errorCode: errorCode
  };
};

/**
 * Validates form data and shows appropriate error messages
 * @param {Object} formData - The form data to validate
 * @param {Object} validationRules - Validation rules
 * @returns {Object} Validation result with errors
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    // Required field validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = rules.requiredMessage || `${field} is required`;
      isValid = false;
    }
    
    // Min length validation
    if (value && rules.minLength && value.length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `${field} must be at least ${rules.minLength} characters`;
      isValid = false;
    }
    
    // Max length validation
    if (value && rules.maxLength && value.length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || `${field} must be no more than ${rules.maxLength} characters`;
      isValid = false;
    }
    
    // Pattern validation (regex)
    if (value && rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `${field} format is invalid`;
      isValid = false;
    }
    
    // Custom validation function
    if (value && rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value, formData);
      if (customResult !== true) {
        errors[field] = customResult || `${field} is invalid`;
        isValid = false;
      }
    }
  });
  
  // Show validation errors as toasts
  if (!isValid) {
    Object.values(errors).forEach(errorMessage => {
      showErrorToast(errorMessage, 'Form Validation');
    });
  }
  
  return { isValid, errors };
};

export { ERROR_TYPES, TOAST_CONFIG };