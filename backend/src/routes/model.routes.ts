import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as modelController from '../controllers/model.controller';

const router: Router = Router();

// Public route - list active models for users
router.get('/', modelController.listActiveModels);

// All other routes require authentication AND admin role
router.use(authenticate, requireAdmin);

// Admin routes
router.get('/admin', modelController.listModels);
router.post('/', modelController.createModel);
router.put('/:key', modelController.updateModel);
router.delete('/:key', modelController.deleteModel);

export default router;
