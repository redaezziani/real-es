import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { MailService } from '../shared/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const verificationToken = this.generateToken({
      sub: registerDto.email,
      type: 'email-verification',
    });

    const user = await this.prisma.users.create({
      data: {
        ...registerDto,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.mailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: 'تم التسجيل بنجاح. تحقق من بريدك الإلكتروني للتحقق من حسابك',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.profile?.role || 'USER',
    };

    const access_token = this.generateToken(payload);

    return {
      user: {
        email: user.email,
        name: user.name,
        profile: user.profile.image || null,
      },
      access_token,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.users.findFirst({
      where: { verificationToken: token, emailVerified: false },
    });

    if (!user || new Date() > user.verificationTokenExpiry) {
      throw new UnauthorizedException('رمز التحقق منتهي الصلاحية أو غير صالح');
    }

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return user;
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('البريد الإلكتروني غير موجود');
    }

    const payload = { sub: user.id, type: 'password-reset' };
    const resetToken = this.generateToken(payload);
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.users.update({
      where: { email },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: expiry,
      },
    });

    await this.mailService.sendPasswordResetEmail(email, resetToken);

    return {
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور بنجاح',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.users.findFirst({
      where: { passwordResetToken: token },
    });

    if (!user || new Date() > user.passwordResetExpiry) {
      throw new UnauthorizedException(
        'رمز إعادة التعيين منتهي الصلاحية أو غير صالح',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });
  }

  private generateToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }
}
