import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { FastifyRequest } from 'fastify';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { EnvSchema } from '../../config/env.schema';
import { AuthService } from '../auth.service';
import type { TCurrentUser } from '../types/current-user.type';
import type { TokenPayload } from '../types/token-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvSchema, true>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: FastifyRequest) => {
          const accessToken = request.unsignCookie(
            request.cookies['accessToken'] as string,
          );

          if (!accessToken.valid) {
            return null;
          }

          return accessToken.value ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: TokenPayload): Promise<TCurrentUser> {
    return this.authService.validateAccessToken(payload);
  }
}
