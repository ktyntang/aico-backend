import { Device, DeviceState } from './model';
import { IDeviceRepository } from './repository';
import { CreateDeviceInput, UpdateDeviceInput } from './schema';
import { NotFoundError, ConflictError } from '@/middleware/errorHandler';
import { logger } from '@/logger';

function computeDelta(
  desired: Record<string, unknown>,
  reported: Record<string, unknown>,
): Record<string, unknown> {
  const delta: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(desired), ...Object.keys(reported)]);
  for (const key of keys) {
    if (JSON.stringify(desired[key]) !== JSON.stringify(reported[key])) {
      delta[key] = desired[key];
    }
  }
  return delta;
}

export class DeviceService {
  constructor(private repo: IDeviceRepository) {}

  create(input: CreateDeviceInput): Device {
    if (this.repo.findById(input.deviceId)) {
      throw new ConflictError(input.deviceId);
    }

    const now = new Date().toISOString();
    const initialConfig = input.config as Record<string, unknown>;
    const state: DeviceState<typeof input.config> = {
      desired: initialConfig,
      reported: initialConfig,
      delta: {},
    };

    const device = {
      deviceId: input.deviceId,
      model: input.model,
      type: input.type,
      status: 'offline' as const,
      state,
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
    const existingState = existing.state as unknown as {
      desired: Record<string, unknown>;
      reported: Record<string, unknown>;
    };

    const newDesired =
      patch.state?.desired !== undefined
        ? { ...existingState.desired, ...patch.state.desired }
        : existingState.desired;

    const newReported =
      patch.state?.reported !== undefined
        ? { ...existingState.reported, ...patch.state.reported }
        : existingState.reported;

    const updated = {
      ...existing,
      ...(patch.status !== undefined && { status: patch.status }),
      state: {
        desired: newDesired,
        reported: newReported,
        delta: computeDelta(newDesired, newReported),
      },
      updatedAt: new Date().toISOString(),
    } as Device;

    this.repo.update(updated);

    const log = logger.child({ deviceId, deviceType: existing.type });

    if (patch.status !== undefined && patch.status !== existing.status) {
      log.info({ from: existing.status, to: patch.status }, 'Device status changed');
    }

    if (patch.state !== undefined) {
      log.info(
        {
          desired: patch.state.desired !== undefined,
          reported: patch.state.reported !== undefined,
        },
        'Device state updated',
      );
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
