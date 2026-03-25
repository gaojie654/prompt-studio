import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as reviewController from '../controllers/review.controller';

const router = Router();

// All routes require authentication AND admin role
router.use(authenticate, requireAdmin);

// GET /api/v1/admin/reviews - List reviews with pagination
router.get('/reviews', reviewController.listReviews);

// POST /api/v1/admin/reviews/:id/pass - Pass a review
router.post('/reviews/:id/pass', reviewController.passReview);

// POST /api/v1/admin/reviews/:id/reject - Reject a review
router.post('/reviews/:id/reject', reviewController.rejectReview);

// GET /api/v1/admin/reviews/stats - Get review statistics
router.get('/reviews/stats', reviewController.getStats);

export default router;
