import { z } from 'zod';

const LightConfigSchema = z.object({
  isOn: z.boolean(),
  brightness: z.number().min(0).max(100),
  colorTemp: z.number().optional(),
});

const ThermostatConfigSchema = z.object({
  targetTemp: z.number(),
  currentTemp: z.number(),
  mode: z.enum(['heat', 'cool', 'auto', 'off']),
});

const CameraConfigSchema = z.object({
  isRecording: z.boolean(),
  resolution: z.enum(['720p', '1080p', '4k']),
  motionDetection: z.boolean(),
});

export const CreateDeviceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('light'),
    name: z.string().min(1),
    location: z.string().min(1),
    config: LightConfigSchema,
  }),
  z.object({
    type: z.literal('thermostat'),
    name: z.string().min(1),
    location: z.string().min(1),
    config: ThermostatConfigSchema,
  }),
  z.object({
    type: z.literal('camera'),
    name: z.string().min(1),
    location: z.string().min(1),
    config: CameraConfigSchema,
  }),
]);

export const UpdateDeviceSchema = z
  .object({
    name: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    status: z.enum(['online', 'offline']).optional(),
    config: z.record(z.unknown()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
