import { Router } from 'express';
import { DbStore } from '@/db/database';
import { FileDeviceRepository } from './repository';
import { DeviceService } from './service';
import { DeviceController } from './controller';
import { validate } from '@/middleware/validate';
import { CreateDeviceSchema, UpdateDeviceSchema } from './schema';

export function createDevicesRouter(db: DbStore): Router {
  const repo = new FileDeviceRepository(db);
  const service = new DeviceService(repo);
  const controller = new DeviceController(service);

  const router = Router();
  router.post('/', validate(CreateDeviceSchema), controller.create);
  router.get('/', controller.findAll);
  router.get('/:id', controller.findById);
  router.patch('/:id', validate(UpdateDeviceSchema), controller.update);
  router.delete('/:id', controller.delete);

  return router;
}
