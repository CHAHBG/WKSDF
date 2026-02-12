const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const {
  corsOptions,
  securityHeaders,
  globalLimiter,
  authLimiter,
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

// Middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(globalLimiter);

// Routes (Placeholders)
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/movements', require('./routes/movements'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/sales', require('./routes/sales'));

// Health Check
app.get('/', (req, res) => {
  res.send('Wakeur Sokhna Daba Falilou API is running');
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  if (err.message === 'Origin not allowed by CORS policy') {
    res.status(403).json({ error: 'CORS origin denied' });
    return;
  }

  console.error('Unhandled API error:', err.message);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
