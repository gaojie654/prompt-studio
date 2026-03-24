import { Router } from 'express';
import * as promptController from '../controllers/prompt.controller';

const router = Router();

// GET /api/prompts/search - Search prompts (public)
router.get('/search', ...promptController.searchPrompts);

// GET /api/prompts - List prompts (public)
router.get('/', ...promptController.listPrompts);

// GET /api/prompts/:id - Get prompt by ID (public)
router.get('/:id', promptController.getPromptById);

export default router;
