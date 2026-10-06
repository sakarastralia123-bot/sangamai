const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const { securityHeaders, permissionsPolicy, mongoSanitizeMiddleware } = require('./middleware/securityHeaders');
const { globalLimiter } = require('./middleware/rateLimiter');
const correlationId = require('./middleware/correlationId');
const { corsOptions } = require('./config/cors');
const { connectDB } = require('./config/db');

const app = express();

// Behind Render/Railway/Vercel proxies: without this, req.ip is the proxy's
// IP, so per-IP rate limiting would treat ALL users as one user.
app.set('trust proxy', 1);

app.use(correlationId());
app.use(securityHeaders());
app.use(permissionsPolicy());
app.use(cors(corsOptions()));
app.use(globalLimiter);
app.use(mongoSanitizeMiddleware());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'OK' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

app.use(errorHandler);

module.exports = app;