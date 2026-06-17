import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { TCurrentUser } from '../types/current-user.type';

export const CurrentUser = createParamDecorator(
  (field: keyof TCurrentUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as TCurrentUser;
    return field ? user[field] : user;
  },
);
