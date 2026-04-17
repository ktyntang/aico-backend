export interface DeviceBase {
  id: string;
  name: string;
  location: string;
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

export type LightDevice = DeviceBase & { type: 'light'; config: LightConfig };
export type ThermostatDevice = DeviceBase & { type: 'thermostat'; config: ThermostatConfig };
export type CameraDevice = DeviceBase & { type: 'camera'; config: CameraConfig };

export type Device = LightDevice | ThermostatDevice | CameraDevice;
