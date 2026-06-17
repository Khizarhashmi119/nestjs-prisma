import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { CookieService } from '../common/cookie.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import type { TCurrentUser } from './types/current-user.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @CurrentUser() user: TCurrentUser<null>,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'] ?? '';

    const { access, refresh } = await this.authService.login(
      user,
      ipAddress,
      userAgent,
    );

    this.cookieService.set(res, 'accessToken', access.token, {
      expires: access.expiresAt,
    });

    this.cookieService.set(res, 'refreshToken', refresh.token, {
      expires: refresh.expiresAt,
    });

    return { message: 'Login successful' };
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async refresh(
    @Res({ passthrough: true }) res: FastifyReply,
    @CurrentUser() user: TCurrentUser,
  ) {
    const { access, refresh } = await this.authService.refreshToken(user);

    this.cookieService.set(res, 'accessToken', access.token, {
      expires: access.expiresAt,
    });

    this.cookieService.set(res, 'refreshToken', refresh.token, {
      expires: refresh.expiresAt,
    });

    return { message: 'Login successful' };
  }

  @Get('logout')
  async logout(
    @Res({ passthrough: true }) res: FastifyReply,
    @CurrentUser() user: TCurrentUser,
  ) {
    await this.authService.logout(user);
    this.cookieService.clear(res, 'accessToken');
    this.cookieService.clear(res, 'refreshToken');
    return { message: 'Logout successful' };
  }
}
