import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma.service';
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

    const verificationToken = this.generateToken();

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
    const user = await this.prisma.users.findUnique({
      where: { email: loginDto.email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        profile: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      );
    }

    // set the jwt in the cookie and also return the user :name and :email and profile
    const jwt = this.jwtService.sign({ sub: user.id });
    return {
      token: jwt,
      user: {
        name: user.name,
        email: user.email,
        profile: user.profile,
      },
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
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('البريد الإلكتروني غير موجود');
    }

    const resetToken = this.generateToken();
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

  private generateToken(): string {
    return [...Array(30)].map(() => Math.random().toString(36)[2]).join('');
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.users.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }
}
