import {
  ArgumentsHost,
  Catch,
  HttpException,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    let statusCode = 500;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') message = body;
      else {
        const details = body as { message?: string | string[]; error?: string };
        message = details.message ?? exception.message;
        error = details.error ?? exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        statusCode = 409;
        message = 'Record already exists';
        error = 'Conflict';
      }
      if (exception.code === 'P2025') {
        statusCode = 404;
        message = 'Record not found';
        error = 'Not Found';
      }
      if (exception.code === 'P2003') {
        statusCode = 400;
        message = 'Related record not found';
        error = 'Bad Request';
      }
      if (exception.code === 'P2004') {
        statusCode = 400;
        message = 'Data violates a database constraint';
        error = 'Bad Request';
      }
    }
    if (statusCode >= 500)
      this.logger.error(
        `Request failed (${exception instanceof Error ? exception.name : 'UnknownError'})`,
      );
    response.status(statusCode).json({ statusCode, message, error });
  }
}
