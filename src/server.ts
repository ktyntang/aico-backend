import { createApp } from '@/app';
import { logger } from '@/logger';

const PORT = process.env.PORT ?? 3000;

const server = createApp().listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
