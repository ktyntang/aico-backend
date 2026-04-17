import { OpenAPIV3 } from 'openapi-types';

const deviceBase = {
  type: 'object',
  properties: {
    deviceId: { type: 'string', example: 'AA:BB:CC:DD:EE:FF' },
    model: { type: 'string', example: 'Philips Hue A19' },
    status: { type: 'string', enum: ['online', 'offline'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
} satisfies OpenAPIV3.SchemaObject;

const lightConfig = {
  type: 'object',
  required: ['isOn', 'brightness'],
  properties: {
    isOn: { type: 'boolean' },
    brightness: { type: 'integer', minimum: 0, maximum: 100, example: 80 },
    colorTemp: { type: 'integer', example: 4000 },
  },
} satisfies OpenAPIV3.SchemaObject;

const thermostatConfig = {
  type: 'object',
  required: ['targetTemp', 'currentTemp', 'mode'],
  properties: {
    targetTemp: { type: 'number', example: 21 },
    currentTemp: { type: 'number', example: 19 },
    mode: { type: 'string', enum: ['heat', 'cool', 'auto', 'off'] },
  },
} satisfies OpenAPIV3.SchemaObject;

const cameraConfig = {
  type: 'object',
  required: ['isRecording', 'resolution', 'motionDetection'],
  properties: {
    isRecording: { type: 'boolean' },
    resolution: { type: 'string', enum: ['720p', '1080p', '4k'] },
    motionDetection: { type: 'boolean' },
  },
} satisfies OpenAPIV3.SchemaObject;

export const spec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'IoT Device Management API',
    version: '1.0.0',
    description: 'RESTful API for managing smart home IoT devices.',
  },
  servers: [{ url: '/api' }],
  tags: [{ name: 'Devices', description: 'IoT device operations' }],
  paths: {
    '/devices': {
      post: {
        tags: ['Devices'],
        summary: 'Register a new device',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    allOf: [
                      {
                        type: 'object',
                        required: ['type', 'deviceId', 'model', 'config'],
                        properties: {
                          type: { type: 'string', enum: ['light'] },
                          deviceId: { type: 'string' },
                          model: { type: 'string' },
                          config: lightConfig,
                        },
                      },
                    ],
                    title: 'Light',
                  },
                  {
                    allOf: [
                      {
                        type: 'object',
                        required: ['type', 'deviceId', 'model', 'config'],
                        properties: {
                          type: { type: 'string', enum: ['thermostat'] },
                          deviceId: { type: 'string' },
                          model: { type: 'string' },
                          config: thermostatConfig,
                        },
                      },
                    ],
                    title: 'Thermostat',
                  },
                  {
                    allOf: [
                      {
                        type: 'object',
                        required: ['type', 'deviceId', 'model', 'config'],
                        properties: {
                          type: { type: 'string', enum: ['camera'] },
                          deviceId: { type: 'string' },
                          model: { type: 'string' },
                          config: cameraConfig,
                        },
                      },
                    ],
                    title: 'Camera',
                  },
                ],
                discriminator: { propertyName: 'type' },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Device registered',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Device' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
      get: {
        tags: ['Devices'],
        summary: 'List all devices',
        responses: {
          '200': {
            description: 'Array of devices',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Device' } },
              },
            },
          },
        },
      },
    },
    '/devices/{id}': {
      parameters: [
        { name: 'deviceId', in: 'path', required: true, schema: { type: 'string' } },
      ],
      get: {
        tags: ['Devices'],
        summary: 'Get a device by ID',
        responses: {
          '200': {
            description: 'Device found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Device' } } },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Devices'],
        summary: 'Update device status or config',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  status: { type: 'string', enum: ['online', 'offline'] },
                  config: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Partial config — merged with existing values',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Device updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Device' } } },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Devices'],
        summary: 'Delete a device',
        responses: {
          '204': { description: 'Device deleted' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
  components: {
    schemas: {
      Device: {
        allOf: [
          deviceBase,
          {
            type: 'object',
            required: ['type', 'config'],
            properties: {
              type: { type: 'string', enum: ['light', 'thermostat', 'camera'] },
              config: { type: 'object', description: 'Device-specific configuration' },
            },
          },
        ],
      },
    },
    responses: {
      NotFound: {
        description: 'Device not found',
        content: {
          'application/json': {
            schema: { type: 'object', properties: { error: { type: 'string' } } },
          },
        },
      },
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
  },
};
