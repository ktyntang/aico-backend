import { useEffect, useState } from 'react';
import type { Device } from './types/device';
import { devicesApi } from './api/devices';
import { DeviceCard } from './components/DeviceCard';
import { DeviceDetail } from './components/DeviceDetail';

export default function App() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devicesApi
      .list()
      .then(setDevices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function fetchDevices() {
    setLoading(true);
    setError(null);
    devicesApi
      .list()
      .then(setDevices)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  const selectedDevice = devices.find((d) => d.deviceId === selectedId) ?? null;

  async function handleDelete(deviceId: string) {
    try {
      await devicesApi.delete(deviceId);
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      if (selectedId === deviceId) setSelectedId(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 text-sm">
      <header className="font-bold flex items-center justify-between px-6 h-14 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        HomeLINK
        <button
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
          onClick={fetchDevices}
          disabled={loading}
        >
          ↻ Refresh Devices
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="flex items-center gap-2 text-red-500 mb-4">
              <p>{error}</p>
              <button
                className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                aria-label="Dismiss error"
                onClick={() => setError(null)}
              >
                ✕
              </button>
            </div>
          )}
          {!loading && !error && devices.length === 0 && (
            <p className="text-gray-400 h-2">No devices found. Please register a new device.</p>
          )}
          <div className="h-8">{loading && <p className="text-gray-400">Loading...</p>}</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {devices.map((device) => (
              <DeviceCard
                key={device.deviceId}
                device={device}
                selected={device.deviceId === selectedId}
                onClick={() =>
                  setSelectedId((id) => (id === device.deviceId ? null : device.deviceId))
                }
                onDelete={() => handleDelete(device.deviceId)}
              />
            ))}
          </div>
        </main>

        {selectedDevice && (
          <DeviceDetail device={selectedDevice} onClose={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  );
}
