import { v4 as uuidv4 } from 'uuid';
import { Device } from './model';
import { IDeviceRepository } from './repository';
import { CreateDeviceInput, UpdateDeviceInput } from './schema';
import { NotFoundError } from '@/middleware/errorHandler';
import { logger } from '@/logger';

export class DeviceService {
  constructor(private repo: IDeviceRepository) {}

  create(input: CreateDeviceInput): Device {
    const now = new Date().toISOString();
    const device = {
      id: uuidv4(),
      name: input.name,
      type: input.type,
      location: input.location,
      status: 'online' as const,
      config: input.config,
      createdAt: now,
      updatedAt: now,
    } as Device;

    this.repo.create(device);

    logger
      .child({ deviceId: device.id, deviceType: device.type })
      .info({ name: device.name, location: device.location }, 'Device registered');

    return device;
  }

  findAll(): Device[] {
    return this.repo.findAll();
  }

  findById(id: string): Device {
    const device = this.repo.findById(id);
    if (!device) throw new NotFoundError(id);
    return device;
  }

  update(id: string, patch: UpdateDeviceInput): Device {
    const existing = this.findById(id);

    const updated = {
      ...existing,
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.location !== undefined && { location: patch.location }),
      ...(patch.status !== undefined && { status: patch.status }),
      config:
        patch.config !== undefined ? { ...existing.config, ...patch.config } : existing.config,
      updatedAt: new Date().toISOString(),
    } as Device;

    this.repo.update(updated);

    const log = logger.child({ deviceId: id, deviceType: existing.type });

    if (patch.status !== undefined && patch.status !== existing.status) {
      log.info({ from: existing.status, to: patch.status }, 'Device status changed');
    }

    if (patch.config !== undefined) {
      const existingConfig = existing.config as unknown as Record<string, unknown>;
      const changedKeys = Object.keys(patch.config).filter(
        (k) => JSON.stringify(patch.config![k]) !== JSON.stringify(existingConfig[k]),
      );
      if (changedKeys.length > 0) {
        const diff = Object.fromEntries(
          changedKeys.map((k) => [k, { from: existingConfig[k], to: patch.config![k] }]),
        );
        log.info({ diff }, 'Device config changed');
      }
    }

    if (patch.name !== undefined || patch.location !== undefined) {
      log.debug(
        { name: patch.name, location: patch.location },
        'Device metadata updated',
      );
    }

    return updated;
  }

  delete(id: string): void {
    const device = this.findById(id);
    this.repo.delete(id);
    logger
      .child({ deviceId: id, deviceType: device.type })
      .info({ name: device.name, location: device.location }, 'Device deleted');
  }
}
