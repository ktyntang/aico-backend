import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { createDatabase } from '@/db/database';
import { createDevicesRouter } from '@/features/devices';
import { errorHandler } from '@/middleware/errorHandler';
import { requestLogger } from '@/middleware/requestLogger';
import { spec } from '@/docs/swagger';

export function createApp(dbPath?: string): express.Application {
  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  app.get('/', (_req, res) => {
    res.json({
      name: 'aico-backend',
      version: '1.0.0',
      status: 'ok',
      docs: '/api/docs',
    });
  });

  const db = createDatabase(dbPath);
  app.use('/api/devices', createDevicesRouter(db));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.use(errorHandler);

  return app;
}
