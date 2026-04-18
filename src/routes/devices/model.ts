export interface DeviceBase {
  deviceId: string;
  model: string;
  status: 'online' | 'offline';
  createdAt: string;
  updatedAt: string;
}

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
  readonly delta: Partial<T>;
}

export type LightDevice = DeviceBase & { type: 'light'; state: DeviceState<LightConfig> };
export type ThermostatDevice = DeviceBase & {
  type: 'thermostat';
  state: DeviceState<ThermostatConfig>;
};
export type CameraDevice = DeviceBase & { type: 'camera'; state: DeviceState<CameraConfig> };

export type Device = LightDevice | ThermostatDevice | CameraDevice;
