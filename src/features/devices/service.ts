import { Device } from './model';
import { IDeviceRepository } from './repository';
import { CreateDeviceInput, UpdateDeviceInput } from './schema';
import { NotFoundError, ConflictError } from '@/middleware/errorHandler';
import { logger } from '@/logger';

export class DeviceService {
  constructor(private repo: IDeviceRepository) {}

  create(input: CreateDeviceInput): Device {
    if (this.repo.findById(input.deviceId)) {
      throw new ConflictError(input.deviceId);
    }

    const now = new Date().toISOString();
    const device = {
      deviceId: input.deviceId,
      model: input.model,
      type: input.type,
      status: 'online' as const,
      config: input.config,
      createdAt: now,
      updatedAt: now,
    } as Device;

    this.repo.create(device);

    logger
      .child({ deviceId: device.deviceId, deviceType: device.type })
      .info({ model: device.model }, 'Device registered');

    return device;
  }

  findAll(): Device[] {
    return this.repo.findAll();
  }

  findById(deviceId: string): Device {
    const device = this.repo.findById(deviceId);
    if (!device) throw new NotFoundError(deviceId);
    return device;
  }

  update(deviceId: string, patch: UpdateDeviceInput): Device {
    const existing = this.findById(deviceId);

    const updated = {
      ...existing,
      ...(patch.status !== undefined && { status: patch.status }),
      config:
        patch.config !== undefined ? { ...existing.config, ...patch.config } : existing.config,
      updatedAt: new Date().toISOString(),
    } as Device;

    this.repo.update(updated);

    const log = logger.child({ deviceId, deviceType: existing.type });

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

    return updated;
  }

  delete(deviceId: string): void {
    const device = this.findById(deviceId);
    this.repo.delete(deviceId);
    logger
      .child({ deviceId, deviceType: device.type })
      .info({ model: device.model }, 'Device deleted');
  }
}
