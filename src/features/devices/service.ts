import { v4 as uuidv4 } from 'uuid';
import { Device } from './model';
import { IDeviceRepository } from './repository';
import { CreateDeviceInput, UpdateDeviceInput } from './schema';
import { NotFoundError } from '@/middleware/errorHandler';

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

    return this.repo.create(device);
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

    return this.repo.update(updated);
  }

  delete(id: string): void {
    const deleted = this.repo.delete(id);
    if (!deleted) throw new NotFoundError(id);
  }
}
