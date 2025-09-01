import OnboardingConfig from '../models/onboardingConfigModel.js';
import User from '../models/userModel.js';

// Get current onboarding configuration
export const getOnboardingConfig = async (req, res) => {
  try {
    const config = await OnboardingConfig.getConfig();
    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Error fetching onboarding config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding configuration',
      error: error.message
    });
  }
};

// Update global onboarding settings
export const updateGlobalSettings = async (req, res) => {
  try {
    const { isEnabled, allowSkipping, requireDocumentVerification } = req.body;
    const userId = req.user._id;
    
    const updates = {
      isEnabled,
      allowSkipping,
      requireDocumentVerification
    };
    
    const config = await OnboardingConfig.updateConfig(
      updates, 
      userId, 
      'Global onboarding settings update'
    );
    
    res.json({
      success: true,
      message: 'Global settings updated successfully',
      config
    });
  } catch (error) {
    console.error('Error updating global settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update global settings',
      error: error.message
    });
  }
};

// Update onboarding step
export const updateOnboardingStep = async (req, res) => {
  try {
    const { stepId } = req.params;
    const { stepName, description, isRequired, isActive, order, category, estimatedTimeMinutes, helpText, validationRules } = req.body;
    const userId = req.user._id;
    
    const config = await OnboardingConfig.getConfig();
    const stepIndex = config.steps.findIndex(step => step.stepId === stepId);
    
    if (stepIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding step not found'
      });
    }
    
    // Update step properties
    if (stepName !== undefined) config.steps[stepIndex].stepName = stepName;
    if (description !== undefined) config.steps[stepIndex].description = description;
    if (isRequired !== undefined) config.steps[stepIndex].isRequired = isRequired;
    if (isActive !== undefined) config.steps[stepIndex].isActive = isActive;
    if (order !== undefined) config.steps[stepIndex].order = order;
    if (category !== undefined) config.steps[stepIndex].category = category;
    if (estimatedTimeMinutes !== undefined) config.steps[stepIndex].estimatedTimeMinutes = estimatedTimeMinutes;
    if (helpText !== undefined) config.steps[stepIndex].helpText = helpText;
    if (validationRules !== undefined) {
      config.steps[stepIndex].validationRules = {
        ...config.steps[stepIndex].validationRules,
        ...validationRules
      };
    }
    
    // Add to modification history
    config.modificationHistory.push({
      modifiedBy: userId,
      modifiedAt: new Date(),
      changes: {
        type: 'step_update',
        stepId,
        updates: req.body
      },
      reason: `Updated onboarding step: ${stepId}`
    });
    
    config.lastModifiedBy = userId;
    await config.save();
    
    res.json({
      success: true,
      message: 'Onboarding step updated successfully',
      step: config.steps[stepIndex]
    });
  } catch (error) {
    console.error('Error updating onboarding step:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update onboarding step',
      error: error.message
    });
  }
};

// Add new onboarding step
export const addOnboardingStep = async (req, res) => {
  try {
    const { stepId, stepName, description, isRequired, isActive, order, category, dependencies, estimatedTimeMinutes, helpText, validationRules } = req.body;
    const userId = req.user._id;
    
    const config = await OnboardingConfig.getConfig();
    
    // Check if step already exists
    const existingStep = config.steps.find(step => step.stepId === stepId);
    if (existingStep) {
      return res.status(400).json({
        success: false,
        message: 'Step with this ID already exists'
      });
    }
    
    const newStep = {
      stepId,
      stepName,
      description,
      isRequired: isRequired !== undefined ? isRequired : true,
      isActive: isActive !== undefined ? isActive : true,
      order: order || config.steps.length + 1,
      category: category || 'basic',
      dependencies: dependencies || [],
      estimatedTimeMinutes: estimatedTimeMinutes || 5,
      helpText: helpText || '',
      validationRules: validationRules || {
        skipAllowed: false,
        requiredFields: []
      }
    };
    
    config.steps.push(newStep);
    
    // Add to modification history
    config.modificationHistory.push({
      modifiedBy: userId,
      modifiedAt: new Date(),
      changes: {
        type: 'step_added',
        stepId,
        stepData: newStep
      },
      reason: `Added new onboarding step: ${stepId}`
    });
    
    config.lastModifiedBy = userId;
    await config.save();
    
    res.json({
      success: true,
      message: 'Onboarding step added successfully',
      step: newStep
    });
  } catch (error) {
    console.error('Error adding onboarding step:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add onboarding step',
      error: error.message
    });
  }
};

// Delete onboarding step
export const deleteOnboardingStep = async (req, res) => {
  try {
    const { stepId } = req.params;
    const userId = req.user._id;
    
    const config = await OnboardingConfig.getConfig();
    const stepIndex = config.steps.findIndex(step => step.stepId === stepId);
    
    if (stepIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding step not found'
      });
    }
    
    const deletedStep = config.steps[stepIndex];
    config.steps.splice(stepIndex, 1);
    
    // Add to modification history
    config.modificationHistory.push({
      modifiedBy: userId,
      modifiedAt: new Date(),
      changes: {
        type: 'step_deleted',
        stepId,
        deletedStep
      },
      reason: `Deleted onboarding step: ${stepId}`
    });
    
    config.lastModifiedBy = userId;
    await config.save();
    
    res.json({
      success: true,
      message: 'Onboarding step deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting onboarding step:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete onboarding step',
      error: error.message
    });
  }
};

// Update document verification settings
export const updateDocumentVerificationSettings = async (req, res) => {
  try {
    const { isEnabled, isRequired, allowSkip, skipMessage, autoApproval, approvalTimeoutHours } = req.body;
    const userId = req.user._id;
    
    const config = await OnboardingConfig.getConfig();
    
    if (isEnabled !== undefined) config.documentVerification.isEnabled = isEnabled;
    if (isRequired !== undefined) config.documentVerification.isRequired = isRequired;
    if (allowSkip !== undefined) config.documentVerification.allowSkip = allowSkip;
    if (skipMessage !== undefined) config.documentVerification.skipMessage = skipMessage;
    if (autoApproval !== undefined) config.documentVerification.autoApproval = autoApproval;
    if (approvalTimeoutHours !== undefined) config.documentVerification.approvalTimeoutHours = approvalTimeoutHours;
    
    // Add to modification history
    config.modificationHistory.push({
      modifiedBy: userId,
      modifiedAt: new Date(),
      changes: {
        type: 'document_verification_settings_update',
        updates: req.body
      },
      reason: 'Updated document verification settings'
    });
    
    config.lastModifiedBy = userId;
    await config.save();
    
    res.json({
      success: true,
      message: 'Document verification settings updated successfully',
      documentVerification: config.documentVerification
    });
  } catch (error) {
    console.error('Error updating document verification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document verification settings',
      error: error.message
    });
  }
};

// Add document type
export const addDocumentType = async (req, res) => {
  try {
    const { name, description, acceptedFormats, maxSizeInMB, isRequired, isActive, validationRules } = req.body;
    const userId = req.user._id;
    
    const config = await OnboardingConfig.getConfig();
    
    // Check if document type already exists
    const existingDoc = config.documentVerification.documentTypes.find(doc => doc.name === name);
    if (existingDoc) {
      return res.status(400).json({
        success: false,
        message: 'Document type with this name already exists'
      });
    }
    
    const newDocumentType = {
      name,
      description,
      acceptedFormats: acceptedFormats || ['pdf', 'jpg', 'png'],
      maxSizeInMB: maxSizeInMB || 5,
      isRequired: isRequired !== undefined ? isRequired : true,
      isActive: isActive !== undefined ? isActive : true,
      validationRules: validationRules || {
        minPages: 1,
        maxPages: 10,
        requiresText: false
      }
    };
    
    config.documentVerification.documentTypes.push(newDocumentType);
    
    // Add to modification history
    config.modificationHistory.push({
      modifiedBy: userId,
      modifiedAt: new Date(),
      changes: {
        type: 'document_type_added',
        documentType: newDocumentType
      },
      reason: `Added new document type: ${name}`
    });
    
    config.lastModifiedBy = userId;
    await config.save();
    
    res.json({
      success: true,
      message: 'Document type added successfully',
      documentType: newDocumentType
    });
  } catch (error) {
    console.error('Error adding document type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add document type',
      error: error.message
    });
  }
};

// Update document type
export const updateDocumentType = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { name, description, acceptedFormats, maxSizeInMB, isRequired, isActive, validationRules } = req.body;
    const userId = req.user._id;
    
    const config = await OnboardingConfig.getConfig();
    const docIndex = config.documentVerification.documentTypes.findIndex(doc => doc._id.toString() === documentId);
    
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document type not found'
      });
    }
    
    // Update document type properties
    if (name !== undefined) config.documentVerification.documentTypes[docIndex].name = name;
    if (description !== undefined) config.documentVerification.documentTypes[docIndex].description = description;
    if (acceptedFormats !== undefined) config.documentVerification.documentTypes[docIndex].acceptedFormats = acceptedFormats;
    if (maxSizeInMB !== undefined) config.documentVerification.documentTypes[docIndex].maxSizeInMB = maxSizeInMB;
    if (isRequired !== undefined) config.documentVerification.documentTypes[docIndex].isRequired = isRequired;
    if (isActive !== undefined) config.documentVerification.documentTypes[docIndex].isActive = isActive;
    if (validationRules !== undefined) {
      config.documentVerification.documentTypes[docIndex].validationRules = {
        ...config.documentVerification.documentTypes[docIndex].validationRules,
        ...validationRules
      };
    }
    
    // Add to modification history
    config.modificationHistory.push({
      modifiedBy: userId,
      modifiedAt: new Date(),
      changes: {
        type: 'document_type_updated',
        documentId,
        updates: req.body
      },
      reason: `Updated document type: ${config.documentVerification.documentTypes[docIndex].name}`
    });
    
    config.lastModifiedBy = userId;
    await config.save();
    
    res.json({
      success: true,
      message: 'Document type updated successfully',
      documentType: config.documentVerification.documentTypes[docIndex]
    });
  } catch (error) {
    console.error('Error updating document type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document type',
      error: error.message
    });
  }
};

// Delete document type
export const deleteDocumentType = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user._id;
    
    const config = await OnboardingConfig.getConfig();
    const docIndex = config.documentVerification.documentTypes.findIndex(doc => doc._id.toString() === documentId);
    
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document type not found'
      });
    }
    
    const deletedDocType = config.documentVerification.documentTypes[docIndex];
    config.documentVerification.documentTypes.splice(docIndex, 1);
    
    // Add to modification history
    config.modificationHistory.push({
      modifiedBy: userId,
      modifiedAt: new Date(),
      changes: {
        type: 'document_type_deleted',
        documentId,
        deletedDocType
      },
      reason: `Deleted document type: ${deletedDocType.name}`
    });
    
    config.lastModifiedBy = userId;
    await config.save();
    
    res.json({
      success: true,
      message: 'Document type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document type',
      error: error.message
    });
  }
};

// Get audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const config = await OnboardingConfig.getConfig().populate('modificationHistory.modifiedBy', 'names email');
    
    const totalLogs = config.modificationHistory.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    
    const logs = config.modificationHistory
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
      .slice(startIndex, endIndex);
    
    res.json({
      success: true,
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs,
        hasNext: endIndex < totalLogs,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
};

// Get onboarding statistics
export const getOnboardingStats = async (req, res) => {
  try {
    const config = await OnboardingConfig.getConfig();
    
    // Get user statistics
    const totalUsers = await User.countDocuments({ role: 'shopowner' });
    const completedOnboarding = await User.countDocuments({ 
      role: 'shopowner', 
      isOnboardingComplete: true 
    });
    const incompleteOnboarding = totalUsers - completedOnboarding;
    const completionRate = totalUsers > 0 ? ((completedOnboarding / totalUsers) * 100).toFixed(1) : 0;
    
    // Get step statistics
    const stepStats = config.steps.map(step => ({
      stepId: step.stepId,
      stepName: step.stepName,
      isRequired: step.isRequired,
      isActive: step.isActive,
      category: step.category
    }));
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        completedOnboarding,
        incompleteOnboarding,
        completionRate: parseFloat(completionRate),
        onboardingEnabled: config.isEnabled,
        documentVerificationEnabled: config.documentVerification.isEnabled,
        totalSteps: config.steps.length,
        requiredSteps: config.steps.filter(step => step.isRequired && step.isActive).length,
        optionalSteps: config.steps.filter(step => !step.isRequired && step.isActive).length,
        stepStats
      }
    });
  } catch (error) {
    console.error('Error fetching onboarding stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding statistics',
      error: error.message
    });
  }
};