import './config/crud.config';

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AllExceptionsFilter, EntityNotFoundFilter } from './common/exception';
import { TransformInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: { origin: '*' } });

  app.useGlobalPipes(new ValidationPipe()); // dùng class-validator
  app.enableCors(); // nếu gọi từ frontend

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Monopoly Bank API')
    .setDescription('API mô phỏng ngân hàng trong game Cờ Tỷ Phú')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const dataSource = app.get(DataSource);

  // check connect to DB
  try {
    await dataSource.query('SELECT 1');
    console.log('✅ Database connection is healthy');
  } catch (error) {
    console.error('❌ Failed to connect to the database', error);
  }

  // handle global exception
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new EntityNotFoundFilter());

  // Dùng interceptor toàn cục
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  console.log('App is running at http://localhost:3000');
}

void bootstrap();
