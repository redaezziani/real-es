import {
  Body,
  Controller,
  Delete,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { VerifyEmailDto } from './dtos/verify-email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { RequestResetDto } from './dtos/request-reset.dto';
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() loginDto: LoginDto, @Res() request: Response) {
    const { token, user } = await this.authService.login(loginDto);
    request.cookie('user-token', token, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      domain:
        process.env.NODE_ENV === 'production' ? 'yourdomain.com' : 'localhost',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    request.send({ user });
  }

  @Post('verify-email')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.verificationToken);
  }

  @Post('request-password-reset')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async requestPasswordReset(@Body() requestResetDto: RequestResetDto) {
    return this.authService.requestPasswordReset(requestResetDto.email);
  }

  @Post('reset-password')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.resetToken,
      resetPasswordDto.newPassword,
    );
  }
  @Delete('logout')
  async logout(@Res() request: Response) {
    // Clear the cookie by setting it to an empty string
    request.cookie('user-token', '', {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      domain:
        process.env.NODE_ENV === 'production' ? 'yourdomain.com' : 'localhost',
      maxAge: 0,
    });

    request.send({ message: 'Logged out successfully' });
  }
}
