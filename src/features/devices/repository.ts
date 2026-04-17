import { LowSync } from 'lowdb';
import { Device } from './model';
import { DbSchema } from '@/db/database';

export interface IDeviceRepository {
  create(device: Device): Device;
  findAll(): Device[];
  findById(id: string): Device | null;
  update(device: Device): Device;
  delete(id: string): boolean;
}

export class LowDbDeviceRepository implements IDeviceRepository {
  constructor(private db: LowSync<DbSchema>) {}

  private get devices(): Device[] {
    return this.db.data!.devices;
  }

  create(device: Device): Device {
    this.devices.push(device);
    this.db.write();
    return device;
  }

  findAll(): Device[] {
    return this.devices;
  }

  findById(id: string): Device | null {
    return this.devices.find((d) => d.id === id) ?? null;
  }

  update(device: Device): Device {
    const index = this.devices.findIndex((d) => d.id === device.id);
    this.devices[index] = device;
    this.db.write();
    return device;
  }

  delete(id: string): boolean {
    const index = this.devices.findIndex((d) => d.id === id);
    if (index === -1) return false;
    this.devices.splice(index, 1);
    this.db.write();
    return true;
  }
}
