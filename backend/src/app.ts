import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/AppError';
import config from './config';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import promptRoutes from './routes/prompt.routes';
import imageRoutes from './routes/image.routes';
import orderRoutes from './routes/order.routes';
import membershipRoutes from './routes/membership.routes';
import adminRoutes from './routes/admin.routes';
import reviewRoutes from './routes/review.routes';
import announcementRoutes from './routes/announcement.routes';
import paymentRoutes from './routes/v1/payment.routes';
import paymentCallbackRoutes from './routes/v1/payment-callback.routes';

const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/prompts', promptRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', reviewRoutes);
app.use('/api/v1', announcementRoutes);

// Payment routes (v1)
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/payment', paymentCallbackRoutes);

// 404 handler
app.use((req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler
app.use(errorHandler);

// Start server only when not being imported for testing
if (require.main === module) {
  const port = config.port;
  app.listen(port, () => {
    console.info(`🚀 Server running at http://localhost:${port}`);
    console.info(`📖 API docs at http://localhost:${port}/api`);
  });
}

export default app;
