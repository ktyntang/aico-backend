import { createApp } from '@/app';
import { logger } from '@/logger';

const PORT = process.env.PORT ?? 3000;

createApp().listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});
