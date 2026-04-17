import { DbStore } from '@/db/database';
import { Device } from './model';

export interface IDeviceRepository {
  create(device: Device): Device;
  findAll(): Device[];
  findById(id: string): Device | null;
  update(device: Device): Device;
  delete(id: string): boolean;
}

export class FileDeviceRepository implements IDeviceRepository {
  constructor(private store: DbStore) {}

  create(device: Device): Device {
    const data = this.store.read();
    data.devices.push(device);
    this.store.write(data);
    return device;
  }

  findAll(): Device[] {
    return this.store.read().devices;
  }

  findById(id: string): Device | null {
    return this.store.read().devices.find((d) => d.id === id) ?? null;
  }

  update(device: Device): Device {
    const data = this.store.read();
    const index = data.devices.findIndex((d) => d.id === device.id);
    data.devices[index] = device;
    this.store.write(data);
    return device;
  }

  delete(id: string): boolean {
    const data = this.store.read();
    const index = data.devices.findIndex((d) => d.id === id);
    if (index === -1) return false;
    data.devices.splice(index, 1);
    this.store.write(data);
    return true;
  }
}
