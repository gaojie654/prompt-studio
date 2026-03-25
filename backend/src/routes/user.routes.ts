import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { getMe, updateMe, getBalance } from '../controllers/user.controller';

const router = Router();

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

router.use(authenticate);

router.get('/me', getMe);
router.put('/me', validate(updateUserSchema), updateMe);
router.get('/balance', getBalance);

export default router;
