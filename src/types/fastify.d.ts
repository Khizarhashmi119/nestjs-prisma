import { TCurrentUser } from '../auth/types/current-user.type';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TCurrentUser;
  }
}
