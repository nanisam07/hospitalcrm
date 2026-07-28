import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // Default 15 mins
const max = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);              // Default 100 requests

export const rateLimiter = rateLimit({
  windowMs,
  max,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default rateLimiter;
