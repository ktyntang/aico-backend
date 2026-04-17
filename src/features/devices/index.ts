import { Router } from 'express';
import { LowSync } from 'lowdb';
import { DbSchema } from '@/db/database';
import { LowDbDeviceRepository } from './repository';
import { DeviceService } from './service';
import { DeviceController } from './controller';
import { validate } from '@/middleware/validate';
import { CreateDeviceSchema, UpdateDeviceSchema } from './schema';

export function createDevicesRouter(db: LowSync<DbSchema>): Router {
  const repo = new LowDbDeviceRepository(db);
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
