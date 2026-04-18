import request from 'supertest';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createApp } from '@/app';
import { Application } from 'express';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validLight = {
  type: 'light',
  deviceId: 'AA:BB:CC:DD:EE:01',
  model: 'Philips Hue A19',
  config: { isOn: true, brightness: 80 },
};

const validThermostat = {
  type: 'thermostat',
  deviceId: 'AA:BB:CC:DD:EE:02',
  model: 'Nest Learning Thermostat',
  config: { targetTemp: 21, currentTemp: 19, mode: 'heat' },
};

const validCamera = {
  type: 'camera',
  deviceId: 'AA:BB:CC:DD:EE:03',
  model: 'Arlo Pro 4',
  config: { isRecording: true, resolution: '1080p', motionDetection: true },
};

// ─── Assertion helpers ────────────────────────────────────────────────────────

const ISO_Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

interface HttpRes {
  status: number;
  body: Record<string, unknown>;
}

function expect400(res: HttpRes): void {
  expect(res.status).toBe(400);
  expect(res.body.error).toBeDefined();
}

function expect404(res: HttpRes): void {
  expect(res.status).toBe(404);
  expect(res.body.error).toBeDefined();
}

// ─── Setup ────────────────────────────────────────────────────────────────────

function tempDbPath(): string {
  return path.join(
    os.tmpdir(),
    `aico-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );
}

describe('Device API', () => {
  let app: Application;
  let dbPath: string;

  beforeEach(() => {
    dbPath = tempDbPath();
    app = createApp(dbPath);
  });

  afterEach(() => {
    try {
      fs.unlinkSync(dbPath);
    } catch {}
  });

  async function registerDevice(body: object = validLight) {
    const res = await request(app).post('/api/devices').send(body);
    return res.body as Record<string, unknown>;
  }

  async function patch(id: string, body: object) {
    return request(app).patch(`/api/devices/${id}`).send(body);
  }

  // ─── GET / ────────────────────────────────────────────────────────────────

  describe('GET /', () => {
    it('returns 200 with api info and status ok', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok', docs: '/api/docs' });
    });
  });

  // ─── POST /api/devices ────────────────────────────────────────────────────

  describe('POST /api/devices', () => {
    it('returns 201 with full device shape and ISO timestamps when registering a light', async () => {
      const res = await request(app).post('/api/devices').send(validLight);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        type: 'light',
        deviceId: 'AA:BB:CC:DD:EE:01',
        model: 'Philips Hue A19',
        status: 'offline',
      });
      expect(res.body.createdAt).toMatch(ISO_Regex);
      expect(res.body.updatedAt).toMatch(ISO_Regex);
    });

    it('returns 201 with desired and reported set to the initial config and delta empty', async () => {
      const res = await request(app).post('/api/devices').send(validLight);
      expect(res.status).toBe(201);
      expect(res.body.state).toMatchObject({
        desired: { isOn: true, brightness: 80 },
        reported: { isOn: true, brightness: 80 },
        delta: {},
      });
    });

    it.each([
      ['thermostat', validThermostat, { targetTemp: 21, mode: 'heat' }],
      ['camera', validCamera, { resolution: '1080p' }],
    ] as const)('returns 201 when registering a %s', async (_, body, expectedState) => {
      const res = await request(app).post('/api/devices').send(body);
      expect(res.status).toBe(201);
      expect(res.body.type).toBe(body.type);
      expect(res.body.state.desired).toMatchObject(expectedState);
      expect(res.body.state.reported).toMatchObject(expectedState);
    });

    it('returns 201 when registering a light with optional colorTemp', async () => {
      const res = await request(app)
        .post('/api/devices')
        .send({ ...validLight, config: { ...validLight.config, colorTemp: 4000 } });
      expect(res.status).toBe(201);
      expect(res.body.state.desired.colorTemp).toBe(4000);
    });

    it('returns 409 when registering a deviceId that already exists', async () => {
      await registerDevice(validLight);
      const res = await request(app).post('/api/devices').send(validLight);
      expect(res.status).toBe(409);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 when body is empty', async () => {
      expect400(await request(app).post('/api/devices').send({}));
    });

    it('returns 400 when device type is unknown', async () => {
      expect400(
        await request(app)
          .post('/api/devices')
          .send({ ...validLight, type: 'fridge' }),
      );
    });

    it('returns 400 when deviceId is whitespace only', async () => {
      expect400(
        await request(app)
          .post('/api/devices')
          .send({ ...validLight, deviceId: '   ' }),
      );
    });

    it('returns 400 when config is an empty object', async () => {
      expect400(
        await request(app)
          .post('/api/devices')
          .send({ ...validLight, config: {} }),
      );
    });

    it('returns 400 when config does not match the device type', async () => {
      expect400(
        await request(app).post('/api/devices').send({
          type: 'light',
          deviceId: 'AA:BB:CC:DD:EE:FF',
          model: 'Test Device',
          config: validThermostat.config,
        }),
      );
    });
  });

  // ─── GET /api/devices ─────────────────────────────────────────────────────

  describe('GET /api/devices', () => {
    it('returns 200 with an empty array when no devices are registered', async () => {
      const res = await request(app).get('/api/devices');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 200 with all registered devices', async () => {
      await registerDevice(validLight);
      await registerDevice(validThermostat);
      const res = await request(app).get('/api/devices');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  // ─── GET /api/devices/:deviceId ───────────────────────────────────────────

  describe('GET /api/devices/:deviceId', () => {
    it('returns 200 with the correct device when found by deviceId', async () => {
      const created = await registerDevice();
      const res = await request(app).get(`/api/devices/${created.deviceId}`);
      expect(res.status).toBe(200);
      expect(res.body.deviceId).toBe(created.deviceId);
    });

    it('returns 404 when deviceId does not exist', async () => {
      expect404(await request(app).get('/api/devices/does-not-exist'));
    });
  });

  // ─── PATCH /api/devices/:deviceId ─────────────────────────────────────────

  describe('PATCH /api/devices/:deviceId', () => {
    let deviceId: string;
    let created: Record<string, unknown>;

    beforeEach(async () => {
      created = await registerDevice();
      deviceId = created.deviceId as string;
    });

    it('returns 200 with updated status and all other fields preserved', async () => {
      const res = await patch(deviceId, { status: 'offline' });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        deviceId: validLight.deviceId,
        status: 'offline',
        type: validLight.type,
        model: validLight.model,
      });
    });

    it('returns 200 with partially updated desired and untouched fields preserved', async () => {
      const res = await patch(deviceId, { state: { desired: { isOn: false } } });
      expect(res.status).toBe(200);
      expect(res.body.state.desired.isOn).toBe(false);
      expect(res.body.state.desired.brightness).toBe(80);
    });

    it('returns 200 with config unchanged when an empty desired object is sent', async () => {
      const res = await patch(deviceId, { state: { desired: {} } });
      expect(res.status).toBe(200);
      expect(res.body.state.desired).toMatchObject(validLight.config);
    });

    it('advances updatedAt but keeps createdAt unchanged after an update', async () => {
      await new Promise((r) => setTimeout(r, 10));
      const res = await patch(deviceId, { status: 'offline' });
      expect(res.body.updatedAt).not.toBe(created.updatedAt);
      expect(res.body.createdAt).toBe(created.createdAt);
    });

    it('returns 404 when deviceId does not exist', async () => {
      expect404(await patch('does-not-exist', { status: 'offline' }));
    });

    it('returns 400 when body is empty', async () => {
      expect400(await patch(deviceId, {}));
    });

    it('returns 400 when status value is invalid', async () => {
      expect400(await patch(deviceId, { status: 'broken' }));
    });

    it('returns 400 when body contains only unknown fields', async () => {
      expect400(await patch(deviceId, { deviceId: 'new-id' }));
    });

    // ─── Shadow model behaviour ──────────────────────────────────────────────

    it('delta correctly reflects keys where desired differs from reported', async () => {
      const res = await patch(deviceId, { state: { desired: { isOn: false } } });
      expect(res.status).toBe(200);
      // desired changed, reported still has isOn: true.  delta should flag isOn
      expect(res.body.state.delta).toMatchObject({ isOn: false });
      expect(res.body.state.reported).toMatchObject({ isOn: true });
    });

    it('delta collapses to empty after reported is updated to match desired', async () => {
      await patch(deviceId, { state: { desired: { isOn: false } } });
      const res = await patch(deviceId, { state: { reported: { isOn: false } } });
      expect(res.status).toBe(200);
      expect(res.body.state.delta).toEqual({});
    });

    it('patching only reported does not change desired', async () => {
      const res = await patch(deviceId, { state: { reported: { isOn: false } } });
      expect(res.status).toBe(200);
      expect(res.body.state.desired.isOn).toBe(true);
      expect(res.body.state.reported.isOn).toBe(false);
    });

    it('updates both desired and reported in one request', async () => {
      const res = await patch(deviceId, {
        state: { desired: { brightness: 50 }, reported: { brightness: 50 } },
      });
      expect(res.status).toBe(200);
      expect(res.body.state.desired.brightness).toBe(50);
      expect(res.body.state.reported.brightness).toBe(50);
      expect(res.body.state.delta).toEqual({});
    });
  });

  // ─── DELETE /api/devices/:deviceId ────────────────────────────────────────

  describe('DELETE /api/devices/:deviceId', () => {
    it('returns 204 when an existing device is deleted', async () => {
      const created = await registerDevice();
      const res = await request(app).delete(`/api/devices/${created.deviceId}`);
      expect(res.status).toBe(204);
    });

    it('returns 404 when fetching a device after it has been deleted', async () => {
      const created = await registerDevice();
      await request(app).delete(`/api/devices/${created.deviceId}`);
      expect404(await request(app).get(`/api/devices/${created.deviceId}`));
    });

    it('excludes the deleted device from the list', async () => {
      const a = await registerDevice(validLight);
      await registerDevice(validThermostat);
      await request(app).delete(`/api/devices/${a.deviceId}`);
      const res = await request(app).get('/api/devices');
      expect(res.body).toHaveLength(1);
      expect(res.body[0].type).toBe('thermostat');
    });
  });
});
