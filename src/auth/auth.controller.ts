import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, LoginPinDto, ForgotPasswordDto, ResetPasswordDto } from './dto/create-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.loginWithPassword(loginDto.email, loginDto.password);
  }

  @Post('login/pin')
  loginPin(@Body() loginPinDto: LoginPinDto) {
    return this.authService.loginWithPin(loginPinDto.username, loginPinDto.pin, loginPinDto.deviceId);
  }

  @Post('verify-pin')
  verifyPin(@Body() dto: LoginPinDto) {
    return this.authService.verifyPin(dto.username, dto.pin);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('refresh')
  refresh(@Body() dto: { refresh_token: string }) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
