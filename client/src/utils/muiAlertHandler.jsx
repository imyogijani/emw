import React from 'react';
import { createRoot } from 'react-dom/client';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a theme for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Alert container component
const AlertContainerComponent = ({ alerts, onClose }) => {
  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          maxWidth: '400px',
        }}
      >
        <Stack spacing={2}>
          {alerts.map((alert) => (
            <Snackbar
              key={alert.id}
              open={true}
              autoHideDuration={alert.duration || 4000}
              onClose={() => onClose(alert.id)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert
                variant="filled"
                severity={alert.severity}
                onClose={alert.isConfirmDialog ? undefined : () => onClose(alert.id)}
                sx={{
                  minWidth: '300px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {alert.title && (
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {alert.title}
                  </div>
                )}
                <div style={{ marginBottom: alert.isConfirmDialog ? '12px' : '0' }}>
                  {alert.message}
                </div>
                {alert.isConfirmDialog && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={alert.onCancel}
                      style={{
                        padding: '6px 16px',
                        border: '1px solid rgba(255,255,255,0.5)',
                        backgroundColor: 'transparent',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {alert.cancelButtonText}
                    </button>
                    <button
                      onClick={alert.onConfirm}
                      style={{
                        padding: '6px 16px',
                        border: 'none',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: alert.severity === 'error' ? '#d32f2f' : alert.severity === 'warning' ? '#ed6c02' : '#1976d2',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {alert.confirmButtonText}
                    </button>
                  </div>
                )}
              </Alert>
            </Snackbar>
          ))}
        </Stack>
      </div>
    </ThemeProvider>
  );
};

// Alert manager class
class AlertManager {
  constructor() {
    this.alerts = [];
    this.container = null;
    this.root = null;
    this.createContainer();
  }

  createContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'mui-alert-container';
      document.body.appendChild(this.container);
      this.root = createRoot(this.container);
    }
  }

  render() {
    this.root.render(
      <AlertContainerComponent
        alerts={this.alerts}
        onClose={(id) => this.removeAlert(id)}
      />
    );
  }

  addAlert(alert) {
    const id = Date.now() + Math.random();
    const newAlert = { ...alert, id };
    this.alerts.push(newAlert);
    this.render();

    // Auto remove after duration
    if (alert.duration !== null) {
      setTimeout(() => {
        this.removeAlert(id);
      }, alert.duration || 4000);
    }

    return id;
  }

  removeAlert(id) {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    this.render();
  }

  clearAll() {
    this.alerts = [];
    this.render();
  }
}

// Create global instance
const alertManager = new AlertManager();

// Environment check
const isDevelopment = import.meta.env.MODE === 'development';

// Export functions that match the Sweet Alert API
export const showErrorToast = (error, context = '') => {
  let message = error;
  let title = context;

  // Handle error objects
  if (typeof error === 'object' && error !== null) {
    if (error.message) {
      message = error.message;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else {
      message = 'An error occurred';
    }
  }

  return alertManager.addAlert({
    severity: 'error',
    title: title || 'Error',
    message,
    duration: isDevelopment ? null : 6000,
  });
};

export const showSuccessToast = (message, context = '') => {
  return alertManager.addAlert({
    severity: 'success',
    title: context || 'Success',
    message,
    duration: 4000,
  });
};

export const showWarningToast = (message, context = '') => {
  return alertManager.addAlert({
    severity: 'warning',
    title: context || 'Warning',
    message,
    duration: 5000,
  });
};

export const showInfoToast = (message, context = '') => {
  return alertManager.addAlert({
    severity: 'info',
    title: context || 'Info',
    message,
    duration: 4000,
  });
};

// Validation function (simplified version)
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(validationRules).forEach(field => {
    const rule = validationRules[field];
    const value = formData[field];

    if (rule.required && (!value || (Array.isArray(value) && value.length === 0))) {
      errors[field] = rule.requiredMessage || `${field} is required`;
      isValid = false;
    }

    if (rule.custom && value) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors[field] = customResult;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};

// API error handler
export const handleApiError = (error, context = '', retryFunction = null, options = {}) => {
  console.error('API Error:', error);
  
  // Log metadata if provided
  if (options.metadata) {
    console.error('Request metadata:', options.metadata);
  }
  
  let errorMessage = 'An unexpected error occurred';
  
  if (error.response) {
    errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
  } else if (error.request) {
    errorMessage = 'Network error. Please check your connection.';
  } else {
    errorMessage = error.message || errorMessage;
  }

  showErrorToast(errorMessage, context);
  
  return {
    handled: true,
    error: errorMessage,
    canRetry: !!retryFunction
  };
};

// Enhanced confirm dialog with Material UI styling
export const showConfirmDialog = (title, text, options = {}) => {
  const {
    confirmButtonText = 'Confirm',
    cancelButtonText = 'Cancel',
    severity = 'warning'
  } = options;

  return new Promise((resolve) => {
    // Create a custom confirmation alert
    const confirmId = alertManager.addAlert({
      severity: severity,
      title: title,
      message: text,
      duration: null, // Don't auto-hide
      isConfirmDialog: true,
      confirmButtonText,
      cancelButtonText,
      onConfirm: () => {
        alertManager.removeAlert(confirmId);
        resolve({ isConfirmed: true });
      },
      onCancel: () => {
        alertManager.removeAlert(confirmId);
        resolve({ isConfirmed: false });
      }
    });
  });
};

// Logout confirmation helper
export const showLogoutConfirm = () => {
  return showConfirmDialog(
    'Confirm Logout',
    'Are you sure you want to logout?',
    {
      confirmButtonText: 'Logout',
      cancelButtonText: 'Stay',
      severity: 'warning'
    }
  );
};

// Delete confirmation helper
export const showDeleteConfirm = (itemName = 'item') => {
  return showConfirmDialog(
    'Confirm Delete',
    `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      severity: 'error'
    }
  );
};

// Export alert manager for advanced usage
export { alertManager };