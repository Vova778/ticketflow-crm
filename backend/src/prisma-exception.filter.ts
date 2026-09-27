import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from './generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped: Record<string, [number, string]> = {
      P2002: [409, 'A record with these unique fields already exists'],
      P2025: [404, 'Record not found or no longer accessible'],
      P2003: [400, 'Related record does not exist'],
    };
    const [statusCode, message] = mapped[error.code] ?? [
      500,
      'Internal server error',
    ];
    response.status(statusCode).json({ statusCode, message });
  }
}
