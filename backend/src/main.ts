import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filters';
import { ApiResponseService } from './shared/api-rensponse.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const apiResponseService = app.get(ApiResponseService);
  app.enableCors({
    origin: 'https://a6bb-197-136-183-18.ngrok-free.app',
  });
  app.useGlobalFilters(new HttpExceptionFilter(apiResponseService));

  await app.listen(3000);
}
void bootstrap();
