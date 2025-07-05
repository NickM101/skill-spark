import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-rensponse.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, ApiResponseService, ConfigService],
  exports: [UsersService],
})
export class UsersModule {}
