import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import * as announcementController from '../controllers/announcement.controller';

const router = Router();

// Public routes (no auth required)
router.get('/announcements', announcementController.getActiveAnnouncements);

// Admin routes (require auth + admin role)
router.use(authenticate, requireAdmin);

router.get('/admin/announcements', announcementController.listAnnouncements);
router.get('/admin/announcements/:id', announcementController.getAnnouncement);
router.post('/admin/announcements', announcementController.createAnnouncement);
router.put('/admin/announcements/:id', announcementController.updateAnnouncement);
router.delete('/admin/announcements/:id', announcementController.deleteAnnouncement);
router.put('/admin/announcements/:id/toggle-pinned', announcementController.togglePinned);
router.put('/admin/announcements/:id/toggle-active', announcementController.toggleActive);

export default router;
