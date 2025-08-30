import express from 'express';
import {
  getOnboardingConfig,
  updateGlobalSettings,
  updateOnboardingStep,
  addOnboardingStep,
  deleteOnboardingStep,
  updateDocumentVerificationSettings,
  addDocumentType,
  updateDocumentType,
  deleteDocumentType,
  getAuditLogs,
  getOnboardingStats
} from '../controllers/onboardingConfigController.js';
import {
  authenticateToken,
  authorizeAdmin
} from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticateToken, authorizeAdmin);

// Configuration routes
router.get('/config', getOnboardingConfig);
router.put('/config/global', updateGlobalSettings);
router.get('/stats', getOnboardingStats);
router.get('/audit-logs', getAuditLogs);

// Step management routes
router.post('/steps', addOnboardingStep);
router.put('/steps/:stepId', updateOnboardingStep);
router.delete('/steps/:stepId', deleteOnboardingStep);

// Document verification routes
router.put('/document-verification', updateDocumentVerificationSettings);
router.post('/document-types', addDocumentType);
router.put('/document-types/:documentId', updateDocumentType);
router.delete('/document-types/:documentId', deleteDocumentType);

export default router;