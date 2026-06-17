import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { TCurrentUser } from '../../auth/types/current-user.type';
import type { EnvSchema } from '../../config/env.schema';
import { AuthService } from '../auth.service';
import type { TokenPayload } from '../types/token-payload.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvSchema, true>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: FastifyRequest) => {
          const refreshToken = request.unsignCookie(
            request.cookies['refreshToken'] as string,
          );

          if (!refreshToken.valid) {
            return null;
          }

          return refreshToken.value ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
    });
  }

  async validate(payload: TokenPayload): Promise<TCurrentUser> {
    return this.authService.validateRefreshToken(payload);
  }
}
