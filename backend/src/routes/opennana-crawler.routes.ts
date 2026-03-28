import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { startCrawl, getStatus } from '../controllers/opennana-crawler.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.post('/opennana', startCrawl);
router.get('/opennana/status', getStatus);

export default router;
