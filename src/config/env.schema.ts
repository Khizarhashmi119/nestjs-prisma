import ms, { type StringValue } from 'ms';
import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.url(),
  COOKIE_SECRET: z.string(),
  ARGON2_SECRET: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .default('15m')
    .refine((value) => ms(value as StringValue) !== undefined, {
      message: 'Invalid duration format',
    }),
  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .default('7d')
    .refine((value) => ms(value as StringValue) !== undefined, {
      message: 'Invalid duration format',
    }),
  ADMIN_EMAIL: z.email(),
  ADMIN_FIRST_NAME: z.string(),
  ADMIN_LAST_NAME: z.string(),
  ADMIN_PASSWORD: z.string(),
});

export type EnvSchema = z.infer<typeof envSchema>;
