import Settings from '../models/settingsModel.js';
import User from '../models/userModel.js';

/**
 * Middleware to check onboarding settings and modify seller access accordingly
 * This middleware should be used after authorizeSeller middleware
 */
export const checkOnboardingSettings = async (req, res, next) => {
  try {
    // Get system settings
    const settings = await Settings.getSettings();
    
    // If onboarding is disabled globally, allow full access
    if (!settings.onboardingEnabled) {
      // Add a flag to indicate onboarding is bypassed
      req.onboardingBypassed = true;
      return next();
    }
    
    // If onboarding is enabled, check user's onboarding status
    const user = req.user;
    
    // Allow access if user has demo access or completed onboarding
    if (user.demoAccess || user.isOnboardingComplete) {
      return next();
    }
    
    // If user hasn't completed onboarding and doesn't have demo access,
    // restrict access to certain endpoints
    return res.status(403).json({
      success: false,
      message: 'Please complete your onboarding process to access this feature',
      requiresOnboarding: true,
      onboardingStep: user.onboardingStep || 1
    });
    
  } catch (error) {
    console.error('Onboarding middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking onboarding settings',
      error: error.message
    });
  }
};

/**
 * Middleware specifically for dashboard access
 * Allows read-only access when onboarding is incomplete but shows appropriate warnings
 */
export const checkDashboardAccess = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    
    // If onboarding is disabled, allow full access
    if (!settings.onboardingEnabled) {
      req.dashboardAccess = 'full';
      return next();
    }
    
    const user = req.user;
    
    // Full access for demo users or completed onboarding
    if (user.demoAccess || user.isOnboardingComplete) {
      req.dashboardAccess = 'full';
      return next();
    }
    
    // Read-only access for incomplete onboarding
    req.dashboardAccess = 'readonly';
    next();
    
  } catch (error) {
    console.error('Dashboard access middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking dashboard access',
      error: error.message
    });
  }
};

/**
 * Middleware to get onboarding settings for frontend
 */
export const getOnboardingSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getSettings();
    
    req.onboardingSettings = {
      enabled: settings.onboardingEnabled,
      requiredSteps: settings.onboardingRequiredSteps || ['shopTiming', 'shopDetails', 'legalDocuments']
    };
    
    next();
  } catch (error) {
    console.error('Get onboarding settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching onboarding settings',
      error: error.message
    });
  }
};