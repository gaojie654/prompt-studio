const express = require('express');

const app = express();

// Simple mock middleware
const auth = (req, res, next) => {
  console.log('[AUTH] called for:', req.method, req.path);
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'no token' });
  }
  next();
};

// Create a sub-router (like paymentRoutes)
const router = express.Router();

// Public route
router.get('/packages/recharge', (req, res) => {
  console.log('[ROUTE] /packages/recharge hit');
  res.json({ packages: ['pkg1', 'pkg2'] });
});

// Protected route
router.get('/orders/:id', auth, (req, res) => {
  console.log('[ROUTE] /orders/:id hit');
  res.json({ orderId: req.params.id });
});

// Mount the sub-router
app.use('/api/v1/payment', router);

app.listen(3001, () => {
  console.log('Test server running on port 3001');
  
  // Make a test request
  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/payment/packages/recharge',
    method: 'GET'
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response status:', res.statusCode);
      console.log('Response body:', data);
      process.exit(0);
    });
  });
  req.on('error', (e) => {
    console.error('Request error:', e.message);
    process.exit(1);
  });
  req.end();
});
