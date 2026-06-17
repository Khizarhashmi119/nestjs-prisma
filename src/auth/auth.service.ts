import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import ms, { type StringValue } from 'ms';
import { v7 as uuidV7 } from 'uuid';
import { DatabaseService } from '../common/database.service';
import type { EnvSchema } from '../config/env.schema';
import type { TCurrentUser } from './types/current-user.type';
import type { TokenPayload } from './types/token-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<EnvSchema, true>,
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  async login(
    currentUser: TCurrentUser<null>,
    ipAddress: string,
    userAgent: string,
  ) {
    const sessionId = uuidV7();
    const access = this.signAccessToken(currentUser.id, sessionId);

    const { token: refreshToken, expiresAt: refreshExpiresAt } =
      this.signRefreshToken(currentUser.id, sessionId);

    await this.databaseService.userSession.create({
      data: {
        id: sessionId,
        ipAddress,
        lastUsedAt: new Date(),
        token: await argon2.hash(refreshToken, {
          secret: Buffer.from(this.configService.get('ARGON2_SECRET')),
        }),
        expiresAt: refreshExpiresAt,
        userAgent,
        userId: currentUser.id,
      },
    });

    return {
      access,
      refresh: {
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    };
  }

  async logout(currentUser: TCurrentUser) {
    const { userSessionId: sessionId } = currentUser;

    await this.databaseService.userSession.update({
      where: {
        id: sessionId,
      },
      data: {
        revokedAt: new Date(),
        isRevoked: true,
        revokedReason: 'logout',
      },
    });
  }

  async refreshToken(currentUser: TCurrentUser) {
    const { userSessionId: sessionId } = currentUser;

    const access = this.signAccessToken(currentUser.id, sessionId);

    const { token: refreshToken, expiresAt: refreshExpiresAt } =
      this.signRefreshToken(currentUser.id, sessionId);

    await this.databaseService.userSession.update({
      where: {
        id: sessionId,
      },
      data: {
        expiresAt: refreshExpiresAt,
        token: await argon2.hash(refreshToken, {
          secret: Buffer.from(this.configService.get('ARGON2_SECRET')),
        }),
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      access,
      refresh: {
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<TCurrentUser<null>> {
    const user = await this.databaseService.user.findUnique({
      where: {
        email,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await argon2.verify(user.password, password, {
      secret: Buffer.from(this.configService.get('ARGON2_SECRET')),
    });

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      userSessionId: null,
    };
  }

  async validateAccessToken(token: TokenPayload): Promise<TCurrentUser> {
    const { sessionId, sub, type } = token;

    if (type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    return this.validateToken(sessionId, sub);
  }

  async validateRefreshToken(token: TokenPayload): Promise<TCurrentUser> {
    const { sessionId, sub, type } = token;

    if (type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    return this.validateToken(sessionId, sub);
  }

  async validateToken(sessionId: string, userId: string) {
    const userSession = await this.databaseService.userSession.findUnique({
      where: {
        id: sessionId,
      },
    });

    if (!userSession) {
      throw new UnauthorizedException('Invalid user session');
    }

    if (userSession.expiresAt < new Date()) {
      throw new UnauthorizedException('User session expired');
    }

    if (userSession.isRevoked) {
      throw new UnauthorizedException('User session revoked');
    }

    const user = await this.databaseService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: userId,
      email: user.email,
      role: user.role.name,
      userSessionId: sessionId,
    };
  }

  signAccessToken(userId: string, sessionId: string) {
    const payload: TokenPayload = {
      sub: userId,
      sessionId,
      type: 'access',
    };

    const secret = this.configService.get('JWT_ACCESS_SECRET', { infer: true });
    const expiresIn = this.configService.get<StringValue>(
      'JWT_ACCESS_EXPIRES_IN',
    );

    const expiresAt = this.getExpiresAt(expiresIn);

    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });

    return { token, expiresAt };
  }

  signRefreshToken(userId: string, sessionId: string) {
    const payload: TokenPayload = {
      sub: userId,
      sessionId,
      type: 'refresh',
    };

    const secret = this.configService.get('JWT_REFRESH_SECRET', {
      infer: true,
    });

    const expiresIn = this.configService.get<StringValue>(
      'JWT_REFRESH_EXPIRES_IN',
    );

    const expiresAt = this.getExpiresAt(expiresIn);

    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });

    return { token, expiresAt };
  }

  private getExpiresAt(expiresIn: StringValue) {
    return new Date(Date.now() + ms(expiresIn));
  }
}
