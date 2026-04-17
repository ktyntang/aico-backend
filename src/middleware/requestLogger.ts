import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { logger } from '@/logger';

export const requestLogger = pinoHttp({
  logger,
  genReqId: () => randomUUID(),

  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});
