import { Body, Controller, Get, Headers, Post, Req, Res, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, LoginPinDto, ForgotPasswordDto, ResetPasswordDto } from './dto/create-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { RateLimit } from './decorators/rate-limit.decorator';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @UseGuards(RateLimitGuard, JwtAuthGuard, RolesGuard)
  @RateLimit({ keyPrefix: 'auth:register', limit: 5, windowMs: 15 * 60 * 1000, bodyFields: ['email'] })
  @Roles(UserRole.ADMIN)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:login', limit: 5, windowMs: 15 * 60 * 1000, bodyFields: ['email'] })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-client-type') clientType?: string,
  ) {
    const tokens = await this.authService.loginWithPassword(loginDto.email, loginDto.password);
    return this.handleAuthResponse(tokens, res, clientType);
  }

  @Post('login/pin')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:login-pin', limit: 5, windowMs: 15 * 60 * 1000, bodyFields: ['username', 'deviceId'] })
  async loginPin(
    @Body() loginPinDto: LoginPinDto,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-client-type') clientType?: string,
  ) {
    const tokens = await this.authService.loginWithPin(loginPinDto.username, loginPinDto.pin, loginPinDto.deviceId);
    return this.handleAuthResponse(tokens, res, clientType);
  }

  @Post('verify-pin')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:verify-pin', limit: 5, windowMs: 15 * 60 * 1000, bodyFields: ['username'] })
  verifyPin(@Body() dto: LoginPinDto) {
    return this.authService.verifyPin(dto.username, dto.pin);
  }

  @Post('forgot-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:forgot-password', limit: 3, windowMs: 60 * 60 * 1000, bodyFields: ['email'] })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:reset-password', limit: 5, windowMs: 60 * 60 * 1000, bodyFields: ['token'] })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit({ keyPrefix: 'auth:refresh', limit: 20, windowMs: 15 * 60 * 1000 })
  async refresh(
    @Body() dto: { refresh_token?: string },
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-client-type') clientType?: string,
  ) {
    const refreshToken = dto?.refresh_token || this.getCookie(req, 'refresh_token');
    const tokens = await this.authService.refreshToken(refreshToken || '');
    return this.handleAuthResponse(tokens, res, clientType);
  }

  @Post('logout')
  async logout(
    @Body() dto: { refresh_token?: string },
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = dto?.refresh_token || this.getCookie(req, 'refresh_token');
    this.clearRefreshCookie(res);
    return this.authService.revokeRefreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }

  private handleAuthResponse(tokens: any, res: Response, clientType?: string) {
    this.setRefreshCookie(res, tokens.refresh_token);

    if (clientType === 'mobile') {
      return tokens;
    }

    const { refresh_token, ...response } = tokens;
    return response;
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    const secure = this.configService.get<string>('COOKIE_SECURE') === 'true';
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshCookie(res: Response) {
    const secure = this.configService.get<string>('COOKIE_SECURE') === 'true';
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure,
      sameSite: secure ? 'none' : 'lax',
      path: '/api/auth',
    });
  }

  private getCookie(req: ExpressRequest, name: string): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;

    const cookie = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
  }
}
