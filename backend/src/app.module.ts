import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailService } from './shared/email/email.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, EmailService],
})
export class AppModule {}
