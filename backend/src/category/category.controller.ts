import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { Role } from '../../generated/prisma';

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: any,
  ) {
    try {
      const category = await this.categoryService.create(createCategoryDto);
      return this.apiResponseService.success(
        category,
        'Category created successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to create category',
        'CATEGORY_CREATE_ERROR',
      );
    }
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    try {
      const result = await this.categoryService.findAll(page, limit, search);
      return this.apiResponseService.paginated(
        result.categories,
        result.page,
        result.limit,
        result.total,
        'Categories retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve categories',
        'CATEGORY_FETCH_ERROR',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const category = await this.categoryService.findOne(id);
      return this.apiResponseService.success(
        category,
        'Category retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve category',
        'CATEGORY_FETCH_ERROR',
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: any,
  ) {
    try {
      const category = await this.categoryService.update(id, updateCategoryDto);
      return this.apiResponseService.success(
        category,
        'Category updated successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to update category',
        'CATEGORY_UPDATE_ERROR',
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      await this.categoryService.remove(id);
      return this.apiResponseService.success(
        null,
        'Category deleted successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to delete category',
        'CATEGORY_DELETE_ERROR',
      );
    }
  }
}
