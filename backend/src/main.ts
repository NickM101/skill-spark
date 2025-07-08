import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filters';
import { ApiResponseService } from './shared/api-rensponse.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const apiResponseService = app.get(ApiResponseService);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter(apiResponseService));

  await app.listen(3000);
}
void bootstrap();
