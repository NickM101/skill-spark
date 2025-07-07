import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponseService } from '../shared/api-rensponse.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService, ApiResponseService],
  exports: [CategoryService],
})
export class CategoryModule {}
