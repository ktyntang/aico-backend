import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '@/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(id: string) {
    super(404, `Device with id '${id}' not found`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Prefer req.log so the trace ID from pino-http is included
  const log = req.log ?? logger;

  if (err instanceof AppError) {
    log.warn({ err, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    log.warn({ err }, 'Validation failed');
    res.status(400).json({ error: 'Validation failed', details: err.errors });
    return;
  }

  log.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
