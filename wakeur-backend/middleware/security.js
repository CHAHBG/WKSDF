const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
];

const parseOrigins = (value) => {
    if (!value) return [];
    return value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
};

const configuredOrigins = parseOrigins(process.env.CORS_ALLOWED_ORIGINS);
const allowedOrigins = new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins]);

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('Origin not allowed by CORS policy'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
    optionsSuccessStatus: 204,
};

const securityHeaders = (_req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

    next();
};

const createRateLimiter = ({ windowMs, max, message }) => {
    const hits = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.socket?.remoteAddress || 'unknown';

        for (const [entryKey, entry] of hits.entries()) {
            if (entry.expiresAt <= now) {
                hits.delete(entryKey);
            }
        }

        const current = hits.get(key);
        if (!current || current.expiresAt <= now) {
            hits.set(key, { count: 1, expiresAt: now + windowMs });
            res.setHeader('RateLimit-Limit', String(max));
            res.setHeader('RateLimit-Remaining', String(max - 1));
            res.setHeader('RateLimit-Reset', String(Math.ceil(windowMs / 1000)));
            next();
            return;
        }

        current.count += 1;
        hits.set(key, current);

        const remaining = Math.max(max - current.count, 0);
        const resetSeconds = Math.max(Math.ceil((current.expiresAt - now) / 1000), 0);

        res.setHeader('RateLimit-Limit', String(max));
        res.setHeader('RateLimit-Remaining', String(remaining));
        res.setHeader('RateLimit-Reset', String(resetSeconds));

        if (current.count > max) {
            res.status(429).json({ error: message });
            return;
        }

        next();
    };
};

const globalLimiter = createRateLimiter({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
    message: 'Too many requests. Please retry shortly.',
});

const authLimiter = createRateLimiter({
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
    message: 'Too many authentication attempts. Please wait before trying again.',
});

module.exports = {
    corsOptions,
    securityHeaders,
    globalLimiter,
    authLimiter,
};
