import mongoose from "mongoose";

const documentTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  acceptedFormats: [{ type: String, required: true }], // ['pdf', 'jpg', 'png']
  maxSizeInMB: { type: Number, default: 5 },
  isRequired: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  validationRules: {
    minPages: { type: Number, default: 1 },
    maxPages: { type: Number, default: 10 },
    requiresText: { type: Boolean, default: false }
  }
}, { timestamps: true });

const onboardingStepSchema = new mongoose.Schema({
  stepId: { type: String, required: true, unique: true },
  stepName: { type: String, required: true },
  description: { type: String, required: true },
  isRequired: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['basic', 'business', 'verification', 'payment'], 
    default: 'basic' 
  },
  dependencies: [{ type: String }], // Array of stepIds that must be completed first
  estimatedTimeMinutes: { type: Number, default: 5 },
  helpText: { type: String },
  validationRules: {
    skipAllowed: { type: Boolean, default: false },
    skipMessage: { type: String },
    requiredFields: [{ type: String }]
  }
}, { timestamps: true });

const onboardingConfigSchema = new mongoose.Schema({
  // Global onboarding settings
  isEnabled: { type: Boolean, default: true },
  allowSkipping: { type: Boolean, default: false },
  requireDocumentVerification: { type: Boolean, default: false },
  
  // Step configuration
  steps: [onboardingStepSchema],
  
  // Document verification settings
  documentVerification: {
    isEnabled: { type: Boolean, default: false },
    isRequired: { type: Boolean, default: false },
    allowSkip: { type: Boolean, default: true },
    skipMessage: { 
      type: String, 
      default: "You can skip document verification and complete it later from your profile." 
    },
    documentTypes: [documentTypeSchema],
    autoApproval: { type: Boolean, default: false },
    approvalTimeoutHours: { type: Number, default: 72 }
  },
  
  // Notification settings
  notifications: {
    sendWelcomeEmail: { type: Boolean, default: true },
    sendReminderEmails: { type: Boolean, default: true },
    reminderIntervalDays: { type: Number, default: 3 },
    maxReminders: { type: Number, default: 3 }
  },
  
  // Access control
  accessControl: {
    allowDashboardAccess: { type: Boolean, default: true },
    restrictedFeatures: [{ type: String }], // Features to restrict until onboarding complete
    demoModeEnabled: { type: Boolean, default: true }
  },
  
  // Audit trail
  lastModifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  modificationHistory: [{
    modifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    modifiedAt: { type: Date, default: Date.now },
    changes: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String }
  }]
}, { timestamps: true });

// Default configuration method
onboardingConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      isEnabled: true,
      allowSkipping: false,
      requireDocumentVerification: false,
      steps: [
        {
          stepId: 'shopDetails',
          stepName: 'Shop Details',
          description: 'Basic shop information and branding',
          isRequired: true,
          isActive: true,
          order: 1,
          category: 'basic',
          estimatedTimeMinutes: 10,
          helpText: 'Provide your shop name, logo, and basic information',
          validationRules: {
            skipAllowed: false,
            requiredFields: ['shopName', 'categories']
          }
        },
        {
          stepId: 'shopTiming',
          stepName: 'Shop Timing',
          description: 'Set your shop operating hours',
          isRequired: true,
          isActive: true,
          order: 2,
          category: 'business',
          dependencies: ['shopDetails'],
          estimatedTimeMinutes: 5,
          helpText: 'Configure when your shop is open for orders',
          validationRules: {
            skipAllowed: false,
            requiredFields: ['workingHours']
          }
        },
        {
          stepId: 'legalDocuments',
          stepName: 'Legal Documents',
          description: 'Upload required business documents',
          isRequired: true,
          isActive: true,
          order: 3,
          category: 'verification',
          dependencies: ['shopDetails', 'shopTiming'],
          estimatedTimeMinutes: 15,
          helpText: 'Upload your business registration and tax documents',
          validationRules: {
            skipAllowed: true,
            skipMessage: 'You can upload documents later from your profile',
            requiredFields: []
          }
        },
        {
          stepId: 'documentVerification',
          stepName: 'Document Verification',
          description: 'Optional identity and business verification',
          isRequired: false,
          isActive: true,
          order: 4,
          category: 'verification',
          dependencies: ['legalDocuments'],
          estimatedTimeMinutes: 10,
          helpText: 'Upload additional documents for faster approval',
          validationRules: {
            skipAllowed: true,
            skipMessage: 'Document verification can be completed later to unlock additional features',
            requiredFields: []
          }
        }
      ],
      documentVerification: {
        isEnabled: true,
        isRequired: false,
        allowSkip: true,
        documentTypes: [
          {
            name: 'Business Registration',
            description: 'Official business registration certificate',
            acceptedFormats: ['pdf', 'jpg', 'png'],
            maxSizeInMB: 5,
            isRequired: true,
            isActive: true,
            validationRules: {
              minPages: 1,
              maxPages: 3,
              requiresText: true
            }
          },
          {
            name: 'Tax ID Certificate',
            description: 'GST registration or tax identification document',
            acceptedFormats: ['pdf', 'jpg', 'png'],
            maxSizeInMB: 5,
            isRequired: true,
            isActive: true,
            validationRules: {
              minPages: 1,
              maxPages: 2,
              requiresText: true
            }
          },
          {
            name: 'Identity Proof',
            description: 'Government issued photo ID of business owner',
            acceptedFormats: ['pdf', 'jpg', 'png'],
            maxSizeInMB: 3,
            isRequired: false,
            isActive: true,
            validationRules: {
              minPages: 1,
              maxPages: 2,
              requiresText: false
            }
          },
          {
            name: 'Address Proof',
            description: 'Proof of business address',
            acceptedFormats: ['pdf', 'jpg', 'png'],
            maxSizeInMB: 3,
            isRequired: false,
            isActive: true,
            validationRules: {
              minPages: 1,
              maxPages: 2,
              requiresText: true
            }
          }
        ],
        autoApproval: false,
        approvalTimeoutHours: 72
      }
    });
  }
  return config;
};

// Update configuration with audit trail
onboardingConfigSchema.statics.updateConfig = async function(updates, userId, reason = 'Configuration update') {
  const config = await this.getConfig();
  const oldConfig = config.toObject();
  
  // Apply updates
  Object.assign(config, updates);
  
  // Add to modification history
  config.modificationHistory.push({
    modifiedBy: userId,
    modifiedAt: new Date(),
    changes: {
      before: oldConfig,
      after: updates
    },
    reason
  });
  
  config.lastModifiedBy = userId;
  await config.save();
  return config;
};

// Get step by ID
onboardingConfigSchema.methods.getStep = function(stepId) {
  return this.steps.find(step => step.stepId === stepId);
};

// Get required steps
onboardingConfigSchema.methods.getRequiredSteps = function() {
  return this.steps.filter(step => step.isRequired && step.isActive)
    .sort((a, b) => a.order - b.order);
};

// Get optional steps
onboardingConfigSchema.methods.getOptionalSteps = function() {
  return this.steps.filter(step => !step.isRequired && step.isActive)
    .sort((a, b) => a.order - b.order);
};

// Get document types
onboardingConfigSchema.methods.getActiveDocumentTypes = function() {
  return this.documentVerification.documentTypes.filter(doc => doc.isActive);
};

// Get required document types
onboardingConfigSchema.methods.getRequiredDocumentTypes = function() {
  return this.documentVerification.documentTypes.filter(doc => doc.isRequired && doc.isActive);
};

const OnboardingConfig = mongoose.model('OnboardingConfig', onboardingConfigSchema);
export default OnboardingConfig;