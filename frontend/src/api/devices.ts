import type { CreateDeviceInput, Device, UpdateDeviceInput } from '../types/device';

const BASE = '/api/devices';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? `Request failed: ${res.status}`);
  return body as T;
}

export const devicesApi = {
  list: () => request<Device[]>(BASE),
  create: (data: CreateDeviceInput) => request<Device>(BASE, { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateDeviceInput) =>
    request<Device>(`${BASE}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
