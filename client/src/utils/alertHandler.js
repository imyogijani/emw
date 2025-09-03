/* eslint-disable no-unused-vars */
import Swal from 'sweetalert2';

// Environment check
const isDevelopment = import.meta.env.DEV;

// Sweet Alert configuration for different alert types
const ALERT_CONFIG = {
  error: {
    icon: 'error',
    backdrop: 'rgba(255, 255, 255, 0.8)',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    showConfirmButton: true,
    timer: isDevelopment ? null : 6000,
    timerProgressBar: !isDevelopment,
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      popup: 'error-alert',
      title: 'error-alert-title',
      content: 'error-alert-content'
    }
  },
  warning: {
    icon: 'warning',
    backdrop: 'rgba(255, 255, 255, 0.8)',
    confirmButtonColor: '#ffc107',
    cancelButtonColor: '#6c757d',
    showConfirmButton: true,
    timer: 5000,
    timerProgressBar: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      popup: 'warning-alert',
      title: 'warning-alert-title',
      content: 'warning-alert-content'
    }
  },
  success: {
    icon: 'success',
    backdrop: 'rgba(255, 255, 255, 0.8)',
    confirmButtonColor: '#28a745',
    showConfirmButton: true,
    timer: 4000,
    timerProgressBar: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      popup: 'success-alert',
      title: 'success-alert-title',
      content: 'success-alert-content'
    }
  },
  info: {
    icon: 'info',
    backdrop: 'rgba(255, 255, 255, 0.8)',
    confirmButtonColor: '#17a2b8',
    showConfirmButton: true,
    timer: 4000,
    timerProgressBar: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    customClass: {
      popup: 'info-alert',
      title: 'info-alert-title',
      content: 'info-alert-content'
    }
  }
};

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * Formats error objects into a consistent structure
 * @param {Error|Object|string} error - The error to format
 * @param {string} context - Additional context
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Formatted error object
 */
const formatError = (error, context = '', metadata = {}) => {
  const timestamp = new Date().toISOString();
  
  // Handle different error types
  if (typeof error === 'string') {
    return {
      message: error,
      type: ERROR_TYPES.CLIENT,
      context,
      metadata,
      timestamp
    };
  }
  
  // Handle Axios errors
  if (error.response) {
    const { status, data, config } = error.response;
    return {
      message: data?.message || data?.error || `Server error (${status})`,
      type: status >= 500 ? ERROR_TYPES.SERVER : ERROR_TYPES.CLIENT,
      statusCode: status,
      requestUrl: config?.url,
      requestMethod: config?.method?.toUpperCase(),
      context,
      metadata,
      timestamp,
      stack: error.stack
    };
  }
  
  // Handle network errors
  if (error.request) {
    return {
      message: 'Network error - please check your connection',
      type: ERROR_TYPES.NETWORK,
      context,
      metadata,
      timestamp,
      stack: error.stack
    };
  }
  
  // Handle generic errors
  return {
    message: error.message || 'An unexpected error occurred',
    type: ERROR_TYPES.UNKNOWN,
    context,
    metadata,
    timestamp,
    stack: error.stack
  };
};

/**
 * Shows an error alert with enhanced formatting and debugging info
 * @param {Error|Object|string} error - The error to display
 * @param {string} context - Additional context about where the error occurred
 * @param {Object} metadata - Additional metadata for debugging
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
  if (isDevelopment && formattedError.stack) {
    console.error('Stack Trace:', formattedError.stack);
  }
  console.groupEnd();
  
  // Create user-friendly message
  let displayMessage = formattedError.message;
  let title = 'Error';
  
  // Add context if provided
  if (context) {
    title = context;
  }
  
  // Show detailed error info only in development
  if (isDevelopment) {
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
  
  Swal.fire({
    title,
    text: displayMessage,
    ...ALERT_CONFIG.error
  });
};

/**
 * Shows a warning alert with enhanced formatting
 * @param {string} message - The warning message
 * @param {string} context - Additional context
 */
export const showWarningToast = (message, context = '') => {
  const title = context || 'Warning';
  
  Swal.fire({
    title,
    text: message,
    ...ALERT_CONFIG.warning
  });
};

/**
 * Shows a success alert with enhanced formatting
 * @param {string} message - The success message
 * @param {string} context - Additional context
 */
export const showSuccessToast = (message, context = '') => {
  const title = context || 'Success';
  
  Swal.fire({
    title,
    text: message,
    ...ALERT_CONFIG.success
  });
};

/**
 * Shows an info alert with enhanced formatting
 * @param {string} message - The info message
 * @param {string} context - Additional context
 */
export const showInfoToast = (message, context = '') => {
  const title = context || 'Information';
  
  Swal.fire({
    title,
    text: message,
    ...ALERT_CONFIG.info
  });
};

/**
 * Handles API errors with automatic retry logic
 * @param {Error} error - The API error
 * @param {string} context - Context about the failed operation
 * @param {Function} retryFunction - Function to retry the operation
 * @param {Object} options - Additional options
 */
export const handleApiError = (error, context = '', retryFunction = null, options = {}) => {
  const { showRetryButton = false, maxRetries = 3, retryDelay = 1000 } = options;
  
  const formattedError = formatError(error, context);
  
  if (showRetryButton && retryFunction) {
    Swal.fire({
      title: context || 'Error',
      text: formattedError.message,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Retry',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed && retryFunction) {
        setTimeout(() => {
          retryFunction();
        }, retryDelay);
      }
    });
  } else {
    showErrorToast(error, context);
  }
};

/**
 * Enhanced form validation with Sweet Alert error display
 * @param {Object} formData - The form data to validate
 * @param {Object} validationRules - Validation rules object
 * @returns {Object} Validation result with isValid boolean and errors object
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
  
  // Show validation errors as alerts
  if (!isValid) {
    const errorMessages = Object.values(errors);
    if (errorMessages.length === 1) {
      showErrorToast(errorMessages[0], 'Form Validation');
    } else {
      const errorList = errorMessages.map((msg, index) => `${index + 1}. ${msg}`).join('\n');
      showErrorToast(errorList, 'Form Validation Errors');
    }
  }
  
  return { isValid, errors };
};

/**
 * Shows a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} text - Dialog text
 * @param {Object} options - Additional options
 * @returns {Promise} Promise that resolves with the user's choice
 */
export const showConfirmDialog = (title, text, options = {}) => {
  const {
    confirmButtonText = 'Yes',
    cancelButtonText = 'No',
    confirmButtonColor = '#28a745',
    cancelButtonColor = '#dc3545',
    icon = 'question'
  } = options;
  
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmButtonColor,
    cancelButtonColor,
    reverseButtons: true
  });
};

export { ALERT_CONFIG };