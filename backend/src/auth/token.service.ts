/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId, // Direct assignment if your schema doesn't use relations
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isRevoked: false,
      },
    });
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        token,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return !!refreshToken;
  }

  async updateRefreshToken(
    userId: string,
    oldToken: string,
    newToken: string,
  ): Promise<void> {
    // Revoke old token
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: oldToken,
      },
      data: {
        isRevoked: true,
      },
    });

    // Save new token
    await this.saveRefreshToken(userId, newToken);
  }

  async removeRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }
}
