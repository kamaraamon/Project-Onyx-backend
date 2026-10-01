import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Activer le CORS pour permettre au frontend Next.js de communiquer avec l'API
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.listen(5000);
  console.log('Onyx NestJS Backend is running on: http://localhost:5000');
}
bootstrap();
