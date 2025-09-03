/**
 * Environment Variables Validation Utility
 * Validates that all required environment variables are set for production deployment
 */

// Define required environment variables for different environments
const REQUIRED_ENV_VARS = {
  // Core application variables
  core: [
    'NODE_ENV',
    'PORT',
    'JWT_SECRET',
    'MONGO_URI'
  ],
  
  // Production-specific variables
  production: [
    'FRONTEND_URL',
    'API_BASE_URL',
    'ALLOWED_ORIGINS'
  ],
  
  // Email service variables (if email features are used)
  email: [
    'EMAIL_SERVICE',
    'EMAIL_USER',
    'EMAIL_PASS'
  ],
  
  // Payment gateway variables (if payment features are used)
  payment: [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ],
  
  // File upload/storage variables (if file upload is used)
  storage: [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ],
  
  // SMS service variables (if SMS features are used)
  sms: [
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER'
  ]
};

// Define optional variables with their default values
const OPTIONAL_ENV_VARS = {
  'PORT': '8080',
  'NODE_ENV': 'development',
  'FRONTEND_URL': 'http://localhost:5173',
  'API_BASE_URL': 'http://localhost:8080',
  'ALLOWED_ORIGINS': 'http://localhost:5173,https://emallworld.com,https://www.emallworld.com'
};

/**
 * Validate environment variables
 * @param {string} environment - The environment to validate for ('development', 'production', 'test')
 * @param {Array} additionalRequired - Additional required variables specific to the deployment
 * @returns {Object} Validation result with status and details
 */
export const validateEnvironmentVariables = (environment = 'development', additionalRequired = []) => {
  const results = {
    isValid: true,
    missing: [],
    warnings: [],
    info: [],
    environment: environment
  };

  console.log(`🔍 Validating environment variables for: ${environment.toUpperCase()}`);
  
  // Always check core variables
  const requiredVars = [...REQUIRED_ENV_VARS.core];
  
  // Add environment-specific variables
  if (environment === 'production') {
    requiredVars.push(...REQUIRED_ENV_VARS.production);
  }
  
  // Add any additional required variables
  if (additionalRequired.length > 0) {
    requiredVars.push(...additionalRequired);
  }
  
  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      results.missing.push(varName);
      results.isValid = false;
      console.error(`❌ Missing required environment variable: ${varName}`);
    } else {
      console.log(`✅ ${varName}: Set`);
    }
  });
  
  // Check optional variables and set defaults if needed
  Object.entries(OPTIONAL_ENV_VARS).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      results.warnings.push(`${varName} not set, using default: ${defaultValue}`);
      console.warn(`⚠️  ${varName} not set, using default: ${defaultValue}`);
    }
  });
  
  // Validate specific variable formats
  validateSpecificFormats(results);
  
  // Check for potentially sensitive variables in logs
  checkSensitiveVariables(results);
  
  return results;
};

/**
 * Validate specific environment variable formats
 * @param {Object} results - The validation results object to update
 */
const validateSpecificFormats = (results) => {
  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET;
  if (jwtSecret) {
    if (jwtSecret.length < 32) {
      results.warnings.push('JWT_SECRET should be at least 32 characters long for security');
      console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
    }
    if (jwtSecret === 'your-secret-key' || jwtSecret === 'secret') {
      results.warnings.push('JWT_SECRET appears to be a default/weak value');
      console.warn('⚠️  JWT_SECRET appears to be a default/weak value');
    }
  }
  
  // Validate MONGO_URI format
  const mongoUri = process.env.MONGO_URI;
  if (mongoUri) {
    if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
      results.warnings.push('MONGO_URI should start with mongodb:// or mongodb+srv://');
      console.warn('⚠️  MONGO_URI should start with mongodb:// or mongodb+srv://');
    }
  }
  
  // Validate PORT
  const port = process.env.PORT;
  if (port) {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      results.warnings.push('PORT should be a valid number between 1 and 65535');
      console.warn('⚠️  PORT should be a valid number between 1 and 65535');
    }
  }
  
  // Validate URLs
  const urlVars = ['FRONTEND_URL', 'API_BASE_URL'];
  urlVars.forEach(varName => {
    const url = process.env[varName];
    if (url) {
      try {
        new URL(url);
        console.log(`✅ ${varName}: Valid URL format`);
      } catch (error) {
        results.warnings.push(`${varName} is not a valid URL format`);
        console.warn(`⚠️  ${varName} is not a valid URL format`);
      }
    }
  });
};

/**
 * Check for potentially sensitive variables that might be logged
 * @param {Object} results - The validation results object to update
 */
const checkSensitiveVariables = (results) => {
  const sensitiveVars = [
    'JWT_SECRET',
    'MONGO_URI',
    'EMAIL_PASS',
    'STRIPE_SECRET_KEY',
    'RAZORPAY_KEY_SECRET',
    'CLOUDINARY_API_SECRET',
    'TWILIO_AUTH_TOKEN'
  ];
  
  sensitiveVars.forEach(varName => {
    if (process.env[varName]) {
      results.info.push(`${varName}: Configured (value hidden for security)`);
    }
  });
};

/**
 * Get environment variable with fallback
 * @param {string} varName - Environment variable name
 * @param {string} fallback - Fallback value if variable is not set
 * @returns {string} The environment variable value or fallback
 */
export const getEnvVar = (varName, fallback = null) => {
  const value = process.env[varName];
  if (!value && fallback !== null) {
    console.warn(`⚠️  Using fallback for ${varName}: ${fallback}`);
    return fallback;
  }
  return value;
};

/**
 * Check if we're in production environment
 * @returns {boolean} True if in production
 */
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if we're in development environment
 * @returns {boolean} True if in development
 */
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
};

/**
 * Get a summary of the current environment configuration
 * @returns {Object} Environment summary
 */
export const getEnvironmentSummary = () => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '8080',
    hasDatabase: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    frontendUrl: process.env.FRONTEND_URL || 'Not set',
    apiBaseUrl: process.env.API_BASE_URL || 'Not set',
    timestamp: new Date().toISOString()
  };
};

/**
 * Initialize environment validation on server startup
 * @param {string} environment - The environment to validate for
 */
export const initializeEnvironmentValidation = (environment = process.env.NODE_ENV || 'development') => {
  console.log('\n🚀 Starting Environment Validation...');
  console.log('=' .repeat(50));
  
  const validation = validateEnvironmentVariables(environment);
  
  console.log('\n📊 Environment Summary:');
  console.log('-'.repeat(30));
  const summary = getEnvironmentSummary();
  Object.entries(summary).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  
  if (!validation.isValid) {
    console.log('\n❌ Environment Validation Failed!');
    console.log('Missing required variables:', validation.missing.join(', '));
    
    if (environment === 'production') {
      console.error('🚨 Production deployment cannot continue with missing environment variables!');
      process.exit(1);
    } else {
      console.warn('⚠️  Development server will continue, but some features may not work properly.');
    }
  } else {
    console.log('\n✅ Environment Validation Passed!');
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log('=' .repeat(50));
  console.log('🚀 Environment Validation Complete\n');
  
  return validation;
};

export default {
  validateEnvironmentVariables,
  getEnvVar,
  isProduction,
  isDevelopment,
  getEnvironmentSummary,
  initializeEnvironmentValidation
};