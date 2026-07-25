import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Préfixe global
  app.setGlobalPrefix('api');

  // 2. Cookie Parser (Indispensable pour lire le cookie CSRF)
  app.use(cookieParser('CLE_SECRETE_COOKIE_SUPER_SECURISEE'));

  // 3. Configuration CSRF: En effet, je l'ai commenté pour l'instant car il pose des problèmes avec Swagger durant le test des Endpoints
  /* const { doubleCsrfProtection } = doubleCsrf({
    // Méthode pour obtenir le secret CSRF
    getSecret: () => 'CLE_SECRETE_CSRF_SUPER_SECURISEE',
    // Méthode pour obtenir l'identifiant de session à partir de la requête
    getSessionIdentifier: (req) => {
      const anyReq: any = req;
      if (anyReq.cookies && anyReq.cookies.sessionId) return String(anyReq.cookies.sessionId);
      if (anyReq.headers && (anyReq.headers['x-session-id'] || anyReq.headers['x-sessionid'])) {
        return String(anyReq.headers['x-session-id'] || anyReq.headers['x-sessionid']);
      }
      return (req.ip as string) || '';
    },
    cookieName: 'x-csrf-token',
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Mettre à true en production avec HTTPS
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], 
  });

  // 4. Application globale du middleware CSRF
  app.use(doubleCsrfProtection);*/
 

  // 5. Active la validation globale 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 6. Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('API Test Cloudinary')
    .setDescription('Test d upload d images')
    .setVersion('1.0')
    .addBearerAuth() // Pour autoriser le jeton JWT dans Swagger
    .addApiKey({ type: 'apiKey', name: 'x-csrf-token', in: 'header' }, 'CSRF-Token') // Permet d'injecter le token CSRF dans Swagger si besoin !
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
