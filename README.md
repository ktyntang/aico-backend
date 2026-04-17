# aico-backend

A RESTful API for managing IoT devices in a smart home environment. Supports lights, thermostats, and cameras with per-device typed configuration, full CRUD operations, and interactive API documentation.

## Prerequisites

- Node.js >= 18
- npm >= 9

## Getting Started

```bash
npm run setup
```

Installs dependencies and starts the dev server. Alternatively:

```bash
npm install
npm run dev
```

The server starts at `http://localhost:3000`.

| URL             | Description              |
| --------------- | ------------------------ |
| `GET /`         | Health check             |
| `GET /api/docs` | Swagger UI documentation |

## API Endpoints

| Method   | Path                     | Description                    |
| -------- | ------------------------ | ------------------------------ |
| `POST`   | `/api/devices`           | Register a new device          |
| `GET`    | `/api/devices`           | List all devices               |
| `GET`    | `/api/devices/:deviceId` | Get a device by ID             |
| `PATCH`  | `/api/devices/:deviceId` | Update device status or config |
| `DELETE` | `/api/devices/:deviceId` | Delete a device                |

## Environment Variables

| Variable    | Default                       | Description                                                       |
| ----------- | ----------------------------- | ----------------------------------------------------------------- |
| `PORT`      | `3000`                        | Port the server listens on                                        |
| `LOG_LEVEL` | `debug` (dev) / `info` (prod) | Pino log level                                                    |
| `NODE_ENV`  | -                             | `production` - JSON logs, `info`- default; `test` - logs silenced |

## Running Tests

```bash
npm test
```

28 tests covering all endpoints. Each test runs against an isolated temporary database file cleaned up afterwards.

## Approach

**Architecture** follows a clean three-layer separation: controller (HTTP), service (business rules), repository (persistence). Each layer is independently testable and replaceable.

**Type safety** is enforced via a TypeScript discriminated union. Device config is fully typed per device type at compile time. And Zod schemas mirror these types at the HTTP boundary, rejecting invalid requests before they reach business logic.

**Data Storage** uses a plain JSON file to keep things simple for review. No infrastructure required, data survives restarts. The `IDeviceRepository` interface means swapping to a real database only needs a single new file with no changes to the service layer. Unfortunately, the current `FileDeviceRepository` reads the full file on every operation (O(n)). An in-memory cache could improve this, but the expected migration path is to a real database (which provides O(1) indexed lookups) so the added complexity isn't worthwhile here.

**Observability** uses Pino logger. Every request gets a UUID trace ID and the error handler logs via `req.log` to correlate errors to the originating request.

## Future Improvements

**Write origin and intent.** Currently `PATCH /devices/:deviceId` conflates two different write types (admin configuration and user commands). These have different access control and audit requirements. Splitting the route into `/devices/:deviceId/config` and `/devices/:deviceId/commands` would let each be governed separately.

**Connectivity ownership.** Currently `status` is a plain writable field. This doesn't reflect how connectivity works in practice where devices can go offline unexpectedly (power loss, network drop, firmware crash) and the client cannot declare itself offline. A better method could be to have the device itself call a heartbeat endpoint periodically while running. The server stamps `lastSeenAt` on each call, and `status` is derived automatically. If a device that hasn't reported in within a configurable TTL is considered `offline`. This lets the server detect and log unexpected disconnects.

**Authentication and authorisation.** All endpoints are currently unauthenticated. In production, an API key or JWT middleware should be added. Per-device ownership would also let the authorisation layer prevent one user from modifying or deleting another's devices.

**Rate limiting.** With more time, rate limiting should be implemented since the endpoints are vulnerable to being flooded either maliciously or by a misconfigured device.

**Telemetry separation.** Sensor readings (temperature, motion events) arrive at much higher frequency than user commands. To prevent confusion over desired state vs observed history,a dedicated `POST /devices/:deviceId/telemetry` endpoint could be added, where data is stored as a time-series log rather than the current `config` snapshot. The API could then provide a `GET /devices/:deviceId/telemetry` endpoint to retrieve historical data for graphing or analysis.

**Pagination and filtering.**
Currently `GET /devices` returns all devices in one response, which could become unwieldy as the number of devices grows.

## Assumptions

- `deviceId` is supplied by the caller, not generated server-side.
- Config on creation is required and complete. All config fields for the device type must be provided at registration. `PATCH` then accepts partial config and performs a shallow merge.
- `status` defaults to `online` on registration. a newly registered device is assumed reachable. In production this should remain `offline` until the device confirms connectivity via a heartbeat.
- Only one instance of the application should be running at a time. Since the file-backed store has no locking or coordination, so running multiple processes against the same file is unsafe.
