export type DeviceStatus = 'online' | 'offline';

export interface LightConfig {
  isOn: boolean;
  brightness: number;
  colorTemp?: number;
}

export interface ThermostatConfig {
  targetTemp: number;
  currentTemp: number;
  mode: 'heat' | 'cool' | 'auto' | 'off';
}

export interface CameraConfig {
  isRecording: boolean;
  resolution: '720p' | '1080p' | '4k';
  motionDetection: boolean;
}

export interface DeviceState<T> {
  desired: Partial<T>;
  reported: Partial<T>;
  delta: Partial<T>;
}

interface DeviceBase {
  deviceId: string;
  model: string;
  status: DeviceStatus;
  createdAt: string;
  updatedAt: string;
}

export type LightDevice = DeviceBase & { type: 'light'; state: DeviceState<LightConfig> };
export type ThermostatDevice = DeviceBase & { type: 'thermostat'; state: DeviceState<ThermostatConfig> };
export type CameraDevice = DeviceBase & { type: 'camera'; state: DeviceState<CameraConfig> };
export type Device = LightDevice | ThermostatDevice | CameraDevice;

export type CreateDeviceInput =
  | { type: 'light'; deviceId: string; model: string; state: LightConfig }
  | { type: 'thermostat'; deviceId: string; model: string; state: ThermostatConfig }
  | { type: 'camera'; deviceId: string; model: string; state: CameraConfig };

export interface UpdateDeviceInput {
  status?: DeviceStatus;
  state?: {
    desired?: Record<string, unknown>;
    reported?: Record<string, unknown>;
  };
}
