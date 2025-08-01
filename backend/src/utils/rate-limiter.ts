import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const port: number = parseInt(process.env.REDIS_PORT || '6379');
const host: string = process.env.REDIS_HOST || 'localhost';
const redisClient = new Redis(port, host);

const opts = {
  storeClient: redisClient,
  points: 100, // Number of points
  duration: 1, // Per second(s)
  keyPrefix: 'rate-limiter',
};

export const rateLimiter = new RateLimiterRedis(opts);
