import path from 'path';
import fs from 'fs';
import { Device } from '@/routes/devices/model';

export interface DbSchema {
  devices: Device[];
}

export interface DbStore {
  read(): DbSchema;
  write(data: DbSchema): void;
}

export function createDatabase(dbPath?: string): DbStore {
  const filePath = dbPath ?? path.join(process.cwd(), 'data', 'db.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ devices: [] }));
  }

  return {
    read: () => JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DbSchema,
    write: (data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2)),
  };
}
