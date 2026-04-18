import type { Device } from '../types/device';

const TYPE_ICON: Record<Device['type'], string> = {
  light: '💡',
  thermostat: '🌡️',
  camera: '📷',
};

interface Props {
  device: Device;
  selected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function DeviceCard({ device, selected, onClick, onDelete }: Props) {
  const hasDelta = Object.keys(device.state.delta).length > 0;

  function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (confirm(`Delete "${device.deviceId}"?`)) onDelete();
  }

  return (
    <div
      className={`relative group bg-white border rounded-xl p-4 cursor-pointer transition-all
        ${
          selected
            ? 'border-blue-500 ring-2 ring-blue-500/10'
            : 'border-gray-200 hover:border-blue-400 hover:shadow-md'
        }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{TYPE_ICON[device.type]}</span>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide
          ${device.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
        >
          {device.status}
        </span>
      </div>
      <div className="font-semibold text-sm mb-1">{device.model}</div>
      <div className="text-xs text-gray-400 font-mono break-all">{device.deviceId}</div>
      {hasDelta && (
        <div className="mt-2 text-[11px] font-semibold text-amber-600">⚠ out of sync</div>
      )}
      <button
        className="absolute bottom-2.5 right-2.5 text-gray-300 hover:text-red-500 text-xs px-1 rounded transition-all cursor-pointer"
        onClick={handleDelete}
        title="Delete"
        aria-label={`Delete ${device.deviceId}`}
      >
        ✕
      </button>
    </div>
  );
}
