/**
 * Enhanced navigation utilities for seamless user experience
 * Provides state preservation and smooth transitions
 */

/**
 * Navigate with state preservation and smooth transitions
 * @param {Function} navigate - React Router navigate function
 * @param {string} path - Target path
 * @param {Object} options - Navigation options
 */
export const navigateWithTransition = (navigate, path, options = {}) => {
  const {
    replace = false,
    state = null,
    delay = 0,
    preserveScroll = false
  } = options;

  // Store current scroll position if needed
  const scrollPosition = preserveScroll ? {
    x: window.scrollX,
    y: window.scrollY
  } : null;

  const performNavigation = () => {
    const navigationOptions = {
      replace,
      state: {
        ...state,
        scrollPosition,
        timestamp: Date.now()
      }
    };

    navigate(path, navigationOptions);
  };

  if (delay > 0) {
    setTimeout(performNavigation, delay);
  } else {
    performNavigation();
  }
};

/**
 * Enhanced role-based navigation with state preservation
 * @param {Function} navigate - React Router navigate function
 * @param {string} role - User role
 * @param {Object} userObj - User object
 * @param {Object} loginResponse - Login response data
 */
export const navigateByRole = (navigate, role, userObj, loginResponse) => {
  const navigationDelay = 100; // Small delay for state synchronization
  
  setTimeout(() => {
    let targetPath = '/';
    let shouldReplace = true;
    
    if (role === 'admin') {
      targetPath = '/admin/dashboard';
    } else if (role === 'shopowner') {
      // Check if user has demo access - skip onboarding
      if (loginResponse?.demoAccess || userObj?.demoAccess) {
        targetPath = '/seller/dashboard';
      } else {
        // Check if seller profile is completed
        const isProfileComplete = userObj?.sellerId && 
          userObj.sellerId.shopName && 
          userObj.sellerId.categories && 
          userObj.sellerId.categories.length > 0;
        
        targetPath = isProfileComplete ? '/seller/dashboard' : '/seller/onboarding';
      }
    } else if (role === 'client') {
      // For clients, check if there's a return URL
      const returnUrl = sessionStorage.getItem('returnUrl');
      if (returnUrl) {
        targetPath = returnUrl;
        sessionStorage.removeItem('returnUrl');
        shouldReplace = false; // Don't replace history for return navigation
      }
    }
    
    navigateWithTransition(navigate, targetPath, {
      replace: shouldReplace,
      state: {
        fromLogin: true,
        userRole: role,
        timestamp: Date.now()
      }
    });
  }, navigationDelay);
};

/**
 * Store return URL for post-login navigation
 * @param {string} url - URL to return to after login
 */
export const setReturnUrl = (url) => {
  if (url && url !== '/login' && url !== '/register' && !url.startsWith('/login') && !url.startsWith('/register')) {
    sessionStorage.setItem('returnUrl', url);
  }
};

/**
 * Get stored return URL
 * @returns {string|null} - Stored return URL or null
 */
export const getReturnUrl = () => {
  return sessionStorage.getItem('returnUrl');
};

/**
 * Clear stored return URL
 */
export const clearReturnUrl = () => {
  sessionStorage.removeItem('returnUrl');
};

/**
 * Handle authentication redirect with state preservation
 * @param {Function} navigate - React Router navigate function
 * @param {string} currentPath - Current path to return to
 */
export const redirectToLogin = (navigate, currentPath) => {
  // Store current path as return URL (exclude login/register pages)
  if (currentPath !== '/login' && currentPath !== '/register') {
    setReturnUrl(currentPath);
  }
  
  navigateWithTransition(navigate, '/login', {
    replace: true,
    state: {
      from: currentPath,
      requiresAuth: true
    }
  });
};

/**
 * Restore scroll position after navigation
 * @param {Object} state - Navigation state containing scroll position
 */
export const restoreScrollPosition = (state) => {
  if (state?.scrollPosition) {
    setTimeout(() => {
      window.scrollTo(state.scrollPosition.x, state.scrollPosition.y);
    }, 100);
  }
};

/**
 * Check if navigation should preserve state
 * @param {Object} location - React Router location object
 * @returns {boolean} - Whether to preserve state
 */
export const shouldPreserveState = (location) => {
  return location.state?.fromLogin || location.state?.preserveState;
};