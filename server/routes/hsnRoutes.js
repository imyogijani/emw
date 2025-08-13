import express from 'express';
import { getAllHSNCodes, getHSNByCode } from '../controllers/hsnController.js';

const router = express.Router();

// Get all HSN codes with optional search
router.get('/', getAllHSNCodes);

// Get HSN code by specific code
router.get('/:code', getHSNByCode);

export default router;