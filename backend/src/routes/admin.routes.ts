import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as adminController from '../controllers/admin.controller';

const router: Router = Router();

// Admin login (no auth required)
router.post('/login', adminController.login);

// All other routes require authentication AND admin role
router.use(authenticate, requireAdmin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// User management
router.get('/users', adminController.listUsers);
router.post('/users/:id/toggle', adminController.toggleUser);

// Order management
router.get('/orders', adminController.listOrders);

// Prompt management
router.get('/prompts', adminController.listPrompts);
router.post('/prompts', adminController.createPrompt);
router.put('/prompts/:id', adminController.updatePrompt);
router.delete('/prompts/:id', adminController.deletePrompt);
router.put('/prompts/:id/featured', adminController.toggleFeatured);

// System settings
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;
