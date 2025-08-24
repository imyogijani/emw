// Utility to get current user from localStorage
export function getCurrentUser() {
  try {
    const user = localStorage.getItem("user");
    if (!user || user === 'null' || user === 'undefined') {
      return null;
    }
    
    const parsedUser = JSON.parse(user);
    
    // Validate that the parsed user has required properties
    if (typeof parsedUser === 'object' && parsedUser !== null) {
      return parsedUser;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error parsing user from localStorage:', error);
    // Clear invalid data
    localStorage.removeItem('user');
    return null;
  }
}

// Utility to set current user in localStorage
export function setCurrentUser(user) {
  try {
    if (!user) {
      localStorage.removeItem('user');
      return true;
    }
    
    localStorage.setItem('user', JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('❌ Error saving user to localStorage:', error);
    return false;
  }
}

// Utility to clear user data
export function clearCurrentUser() {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return true;
  } catch (error) {
    console.error('❌ Error clearing user data:', error);
    return false;
  }
}

// Utility to check if user is authenticated
export function isAuthenticated() {
  const user = getCurrentUser();
  const token = localStorage.getItem('token');
  
  return !!(user && token);
}

// Utility to get user role
export function getUserRole() {
  const user = getCurrentUser();
  return user?.role || null;
}

// Utility to check if user has specific role
export function hasRole(requiredRole) {
  const userRole = getUserRole();
  return userRole === requiredRole;
}
