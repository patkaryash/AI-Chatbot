import redisClient from '../services/redis.service.js';

const memoryStore = new Map();

function getClientIp(req) {
  return req.headers['x-forwarded-for']
    || req.headers['x-real-ip']
    || req.connection.remoteAddress
    || req.ip
    || 'unknown';
}

async function rateLimit({ keyPrefix, windowMs, maxRequests, message }) {
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    const identifier = getClientIp(req);
    const key = `rate_limit:${keyPrefix}:${identifier}`;

    try {
      let current = 0;

      if (redisClient && typeof redisClient.incr === 'function') {
        // Redis-backed rate limiting
        current = await redisClient.incr(key);
        if (current === 1) {
          await redisClient.expire(key, windowSeconds);
        }
        const ttl = await redisClient.ttl(key);
        res.setHeader('RateLimit-Limit', maxRequests);
        res.setHeader('RateLimit-Remaining', Math.max(0, maxRequests - current));
        res.setHeader('RateLimit-Reset', ttl);
      } else {
        // Memory fallback (not suitable for multi-process deployments)
        const now = Date.now();
        const record = memoryStore.get(key);
        if (!record || now - record.resetTime >= windowMs) {
          memoryStore.set(key, { count: 1, resetTime: now + windowMs });
          current = 1;
        } else {
          record.count += 1;
          current = record.count;
        }
        const ttl = Math.ceil((memoryStore.get(key).resetTime - now) / 1000);
        res.setHeader('RateLimit-Limit', maxRequests);
        res.setHeader('RateLimit-Remaining', Math.max(0, maxRequests - current));
        res.setHeader('RateLimit-Reset', ttl);
      }

      if (current > maxRequests) {
        return res.status(429).json({
          error: message || 'Too many requests, please try again later.',
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error.message);
      // Fail open: allow request if rate limiter breaks
      next();
    }
  };
}

export const authRateLimit = () => rateLimit({
  keyPrefix: 'auth',
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export const messageRateLimit = () => rateLimit({
  keyPrefix: 'message',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: 'Too many messages sent. Please slow down.',
});

export const chatCreateRateLimit = () => rateLimit({
  keyPrefix: 'chat_create',
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many chats created. Please try again later.',
});

export default rateLimit;
