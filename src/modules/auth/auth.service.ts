import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    this.validateCredentials(dto.email, dto.password);
    const passwordHash = this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    return this.issueToken(user.id, user.email);
  }

  async login(dto: LoginDto) {
    this.validateCredentials(dto.email, dto.password);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash || user.passwordHash !== this.hashPassword(dto.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(user.id, user.email);
  }

  async googleLogin(idToken: string) {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = (await response.json()) as {
      sub?: string;
      email?: string;
      aud?: string;
      name?: string;
    };

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedException('Google token audience mismatch');
    }

    const user = await this.prisma.user.upsert({
      where: { email: payload.email },
      update: { googleId: payload.sub, name: payload.name ?? undefined },
      create: { email: payload.email, googleId: payload.sub, name: payload.name ?? undefined },
    });

    return this.issueToken(user.id, user.email);
  }

  private issueToken(userId: string, email: string) {
    return { accessToken: this.tokenService.sign({ sub: userId, email }), tokenType: 'Bearer' };
  }

  private hashPassword(password: string) {
    const secret = process.env.PASSWORD_HASH_SECRET ?? 'password-secret';
    return crypto.createHmac('sha256', secret).update(password).digest('hex');
  }

  private validateCredentials(email: string, password: string) {
    if (!email || !email.includes('@') || !password || password.length < 8) {
      throw new BadRequestException('Invalid credentials payload');
    }
  }
}
