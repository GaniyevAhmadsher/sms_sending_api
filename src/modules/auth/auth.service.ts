import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from './token.service';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    this.validateCredentials(dto.email, dto.password);
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = this.hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    return this.issueToken(user.id);
  }

  async login(dto: LoginDto) {
    this.validateCredentials(dto.email, dto.password);
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash || !this.verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueToken(user.id);
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

    return this.issueToken(user.id);
  }

  private issueToken(userId: string) {
    return {
      accessToken: this.tokenService.signAccessToken({ sub: userId }),
      refreshToken: this.tokenService.signRefreshToken({ sub: userId }),
      tokenType: 'Bearer',
    };
  }

  refresh(refreshToken: string) {
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    return this.issueToken(payload.sub);
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string) {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) {
      return false;
    }

    const hashedBuffer = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'utf8');
    const storedBuffer = Buffer.from(hash, 'utf8');
    return hashedBuffer.length === storedBuffer.length && timingSafeEqual(hashedBuffer, storedBuffer);
  }

  private validateCredentials(email: string, password: string) {
    if (!email || !email.includes('@') || !password || password.length < 8) {
      throw new BadRequestException('Invalid credentials payload');
    }
  }
}
