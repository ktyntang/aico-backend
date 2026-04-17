import { LowSync, JSONFileSync } from 'lowdb';
import path from 'path';
import fs from 'fs';
import { Device } from '@/features/devices/model';

export interface DbSchema {
  devices: Device[];
}

export function createDatabase(dbPath?: string): LowSync<DbSchema> {
  const filePath = dbPath ?? path.join(process.cwd(), 'data', 'db.json');
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const adapter = new JSONFileSync<DbSchema>(filePath);
  const db = new LowSync<DbSchema>(adapter);
  db.read();
  db.data ??= { devices: [] };
  return db;
}
