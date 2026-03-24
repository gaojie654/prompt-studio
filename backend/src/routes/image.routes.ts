import { Router } from 'express';
import * as imageController from '../controllers/image.controller';

const router = Router();

// GET /api/v1/images - List user's images (auth required)
router.get('/', ...imageController.listImages);

// GET /api/v1/images/:id - Get image by ID (auth required)
router.get('/:id', imageController.getImageById);

export default router;
