import { z } from 'zod';
import { envSchema } from './env.schema';

import { Logger } from '@nestjs/common';

export function validateEnv(config: Record<string, any>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    Logger.error(z.treeifyError(parsed.error));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}
