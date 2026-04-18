import type { Device } from '../types/device';

interface Props {
  device: Device;
  onClose: () => void;
}

function StateTable({
  data,
  label,
  highlight,
}: {
  data: object;
  label: string;
  highlight?: boolean;
}) {
  const entries = Object.entries(data);
  return (
    <div
      className={`border rounded-lg overflow-hidden ${highlight ? 'border-amber-200 bg-amber-50' : 'border-gray-200'}`}
    >
      <h4
        className={`text-[11px] font-bold uppercase tracking-wider px-3 py-2 border-b
        ${highlight ? 'text-amber-600 bg-amber-100 border-amber-200' : 'text-gray-400 bg-gray-50 border-gray-200'}`}
      >
        {label}
      </h4>
      {entries.length === 0 ? (
        <p className="px-3 py-2 text-xs text-gray-400">—</p>
      ) : (
        <table className="w-full border-collapse">
          <tbody>
            {entries.map(([k, v]) => (
              <tr
                key={k}
                className={`border-t ${highlight ? 'border-amber-200' : 'border-gray-100'}`}
              >
                <td className="px-3 py-1.5 text-xs text-gray-400 w-1/2">{k}</td>
                <td className="px-3 py-1.5 text-xs font-mono text-gray-900">{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function DeviceDetail({ device, onClose }: Props) {
  const hasDelta = Object.keys(device.state.delta).length > 0;

  return (
    <aside className="w-90 shrink-0 bg-white border-l border-gray-200 overflow-y-auto p-6 flex flex-col gap-5 max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:z-50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-base">{device.model}</h2>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {device.type} · {device.deviceId}
          </p>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
          aria-label="Close detail panel"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <span
        className={`self-start text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide
        ${device.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
      >
        {device.status}
      </span>

      <div className="flex flex-col gap-3">
        <StateTable label="Desired" data={device.state.desired} />
        <StateTable label="Reported" data={device.state.reported} />
        <StateTable label="Delta" data={device.state.delta} highlight={hasDelta} />
      </div>

      <div className="flex flex-col gap-0.5 text-[11px] text-gray-400 pt-3 border-t border-gray-100">
        <span>Created {new Date(device.createdAt).toLocaleString()}</span>
        <span>Updated {new Date(device.updatedAt).toLocaleString()}</span>
      </div>
    </aside>
  );
}
