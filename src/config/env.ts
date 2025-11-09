import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().regex(/^\d+$/).default('5000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  CLIENT_ORIGIN: z.string().url('CLIENT_ORIGIN must be a valid URL').optional(),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  RATE_LIMIT_WINDOW_MINUTES: z.string().regex(/^\d+$/).default('15'),
  RATE_LIMIT_MAX_REQUESTS: z.string().regex(/^\d+$/).default('100'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD must be at least 12 characters').optional(),
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required').optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required').optional(),
  GOOGLE_CALLBACK_URL: z.string().url('GOOGLE_CALLBACK_URL must be a valid URL').optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed');
}

const env = parsed.data;

export const appConfig = {
  env: env.NODE_ENV,
  isDev: env.NODE_ENV === 'development',
  port: Number(env.PORT)
};

export const databaseConfig = {
  uri: env.MONGO_URI
};

export const securityConfig = {
  clientOrigin: env.CLIENT_ORIGIN,
  rateLimit: {
    windowMs: Number(env.RATE_LIMIT_WINDOW_MINUTES) * 60 * 1000,
    max: Number(env.RATE_LIMIT_MAX_REQUESTS)
  }
};

export const authConfig = {
  accessToken: {
    secret: env.JWT_ACCESS_SECRET,
    expiresIn: env.JWT_ACCESS_EXPIRY
  },
  refreshToken: {
    secret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_REFRESH_EXPIRY
  }
};

export const stripeConfig = {
  secretKey: env.STRIPE_SECRET_KEY,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET
};

export const adminConfig = {
  email: env.ADMIN_EMAIL,
  password: env.ADMIN_PASSWORD
};

export const oauthConfig = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID || '',
    clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: env.GOOGLE_CALLBACK_URL || ''
  }
};

export { env };
