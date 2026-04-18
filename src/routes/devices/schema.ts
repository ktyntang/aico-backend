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

const deviceIdSchema = z.string().trim().min(1).max(100);
const modelSchema = z.string().trim().min(1).max(100);

export const CreateDeviceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('light'),
    deviceId: deviceIdSchema,
    model: modelSchema,
    state: LightConfigSchema,
  }),
  z.object({
    type: z.literal('thermostat'),
    deviceId: deviceIdSchema,
    model: modelSchema,
    state: ThermostatConfigSchema,
  }),
  z.object({
    type: z.literal('camera'),
    deviceId: deviceIdSchema,
    model: modelSchema,
    state: CameraConfigSchema,
  }),
]);

export const UpdateDeviceSchema = z
  .object({
    status: z.enum(['online', 'offline']).optional(),
    state: z
      .object({
        desired: z.record(z.unknown()).optional(),
        reported: z.record(z.unknown()).optional(),
      })
      .refine((s) => s.desired !== undefined || s.reported !== undefined, {
        message: 'state must include at least one of desired or reported',
      })
      .optional(),
  })
  .refine((data) => data.status !== undefined || data.state !== undefined, {
    message: 'At least one field must be provided',
  });

export const LightStateUpdateSchema = LightConfigSchema.partial();
export const ThermostatStateUpdateSchema = ThermostatConfigSchema.partial();
export const CameraStateUpdateSchema = CameraConfigSchema.partial();

export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
