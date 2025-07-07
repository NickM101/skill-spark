export class CategoryResponseDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    courses: number;
  };
}
