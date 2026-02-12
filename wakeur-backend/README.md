# Wakeur Backend API

Express API for Wakeur inventory, sales, transfers, and auth-protected endpoints.

## Setup

1. Install dependencies
```bash
npm install
```

2. Configure environment variables in `.env`
```bash
PORT=5000
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Optional security config
TRUST_PROXY=false
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
```

3. Run
```bash
npm run dev
```

## Security hardening included

- Strict CORS allowlist
- Basic API security headers
- Request payload size limit
- Global and auth-specific rate limiting
- Bearer token validation middleware for protected routes
- Centralized 404 and error responses

## Main endpoints

- `GET /health`
- `GET /api/auth/profile` (Bearer token required)
- `GET /api/products`
- `POST /api/products` (Bearer token required)
- `PUT /api/products/:id` (Bearer token required)
- `DELETE /api/products/:id` (Bearer token required)
