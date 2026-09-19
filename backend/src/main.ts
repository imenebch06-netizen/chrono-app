import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { LanguageInterceptor } from './interceptors/language.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

 
  app.setGlobalPrefix('api');

  
  app.use(cookieParser('CLE_SECRETE_COOKIE_SUPER_SECURISEE'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  
  const config = new DocumentBuilder()
    .setTitle('API Test Cloudinary')
    .setDescription("Tester les differents modules de l'API")
    .setVersion('1.0')
    .addBearerAuth() 
    .addApiKey({ type: 'apiKey', name: 'x-csrf-token', in: 'header' }, 'CSRF-Token') 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  app.useGlobalInterceptors(new LanguageInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
