import express from 'express';
import { authenticateToken, customerOnly } from '../middlewares/authMiddleware.js';
import { getUserOrders, createOrder } from '../controllers/orderController.js';

const router = express.Router();

// Get user's orders
router.get('/user-orders', authenticateToken, getUserOrders);

// Create a new order (checkout) - only customers allowed
router.post('/create', authenticateToken, customerOnly, createOrder);

export default router;
