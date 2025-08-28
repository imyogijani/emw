/* eslint-disable no-unused-vars */
import axios from './axios';

// Cache for system settings to avoid repeated API calls
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch system settings from the server
 * @returns {Promise<Object>} System settings object
 */
export const getSystemSettings = async () => {
  try {
    // Check if we have valid cached settings
    if (settingsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return settingsCache;
    }

    const response = await axios.get('/api/admin/settings');
    if (response.data.success) {
      settingsCache = response.data.settings;
      cacheTimestamp = Date.now();
      return settingsCache;
    } else {
      throw new Error('Failed to fetch system settings');
    }
  } catch (error) {
    console.error('Error fetching system settings:', error);
    // Return default settings if API fails
    return {
      onboardingEnabled: true,
      onboardingRequiredSteps: ['basicDetails', 'legalDocuments']
    };
  }
};

/**
 * Clear the settings cache (useful when settings are updated)
 */
export const clearSettingsCache = () => {
  settingsCache = null;
  cacheTimestamp = null;
};

/**
 * Check if onboarding is enabled
 * @returns {Promise<boolean>}
 */
export const isOnboardingEnabled = async () => {
  const settings = await getSystemSettings();
  return settings.onboardingEnabled !== false; // Default to true if not set
};

/**
 * Get required onboarding steps
 * @returns {Promise<Array>}
 */
export const getRequiredOnboardingSteps = async () => {
  const settings = await getSystemSettings();
  // Always include basicDetails and legalDocuments as required steps
  return settings.onboardingRequiredSteps || ['basicDetails'];
};

/**
 * Map step keys to step numbers for the onboarding flow
 */
export const STEP_MAPPING = {
  basicDetails: 1,
  shopTiming: 2,
  legalDocuments: 3,
  subscription: 4
};

/**
 * Get the step number for a given step key
 * @param {string} stepKey - The step key (e.g., 'shopTiming')
 * @returns {number} The step number
 */
export const getStepNumber = (stepKey) => {
  return STEP_MAPPING[stepKey] || 1;
};

/**
 * Get step key from step number
 * @param {number} stepNumber - The step number
 * @returns {string} The step key
 */
export const getStepKey = (stepNumber) => {
  const entries = Object.entries(STEP_MAPPING);
  const found = entries.find(([key, num]) => num === stepNumber);
  return found ? found[0] : 'basicDetails';
};