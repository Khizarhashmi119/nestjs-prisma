import type { CookieSerializeOptions } from '@fastify/cookie';
import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

@Injectable()
export class CookieService {
  private readonly defaultOptions: CookieSerializeOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/api/v1',
    signed: true,
  };

  set(
    res: FastifyReply,
    key: string,
    value: string,
    options?: CookieSerializeOptions,
  ) {
    res.setCookie(key, value, {
      ...this.defaultOptions,
      ...options,
    });
  }

  clear(res: FastifyReply, key: string, options?: CookieSerializeOptions) {
    res.clearCookie(key, {
      ...this.defaultOptions,
      ...options,
    });
  }
}
