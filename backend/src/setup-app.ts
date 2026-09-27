import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './prisma-exception.filter';

export function setupApp(app: INestApplication) {
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableShutdownHooks();
  const config = new DocumentBuilder()
    .setTitle('TicketFlow CRM')
    .setDescription(
      'JWT API. ADMIN: all tickets; MANAGER: assigned to self or unassigned; USER: own tickets. Logout removes the token on the client.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
