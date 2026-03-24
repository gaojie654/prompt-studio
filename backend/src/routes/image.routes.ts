import { Router } from 'express';
import { asyncHandler } from '../utils/AppError';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  // TODO: List images
  res.json({ images: [] });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  // TODO: Get image by ID
  res.json({ image: null });
}));

router.post('/', asyncHandler(async (req, res) => {
  // TODO: Upload image
  res.status(201).json({ message: 'Upload image endpoint' });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  // TODO: Delete image
  res.json({ message: 'Delete image endpoint' });
}));

export default router;
