# AICO Technical Test

A RESTful API for managing IoT devices in a smart home environment. Supports lights, thermostats, and cameras with per-device typed configuration, full CRUD operations, and interactive API documentation. Includes a (very simple) static frontend dashboard for device management.

## Prerequisites

- Node.js >= 18
- npm >= 9

## Getting Started

```bash
npm run setup
```

Single command to install all dependencies and start both backend and frontend servers concurrently.

Alternatively:

```bash
npm install
npm run dev
```

To start just the backend server with hot reload. Then in a separate terminal:

```bash
npm install --prefix frontend
npm run dev:frontend
```

To start the frontend server separately.

| Service      | URL                              | Description             |
| ------------ | -------------------------------- | ----------------------- |
| Backend      | `http://localhost:3000`          | REST API                |
| Backend Docs | `http://localhost:3000/api/docs` | Swagger UI              |
| Frontend     | `http://localhost:5173`          | Simple device dashboard |
|              |

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

Each test runs against an isolated temporary database file cleaned up afterwards.

## Approach

**Architecture** follows a clean three-layer separation: controller (HTTP), service (business rules), repository (persistence). Each layer is independently testable and replaceable.

**Type safety** is enforced via a TypeScript discriminated union. Device config is fully typed per device type at compile time. And Zod schemas mirror these types at the HTTP boundary, rejecting invalid requests before they reach business logic.

**Shadow state model** separates device intent from device reality. Each device holds a `state` object with three fields:

| Field      | Written by              | Meaning                                      |
| ---------- | ----------------------- | -------------------------------------------- |
| `desired`  | Application / dashboard | What you want the device to do               |
| `reported` | The device itself       | What the device last confirmed it is doing   |
| `delta`    | Computed (read-only)    | Keys where `desired` differs from `reported` |

In production, writes to `reported` would come from a separate device-authenticated endpoint, and writes to `desired` would come from the application. But for simplicity, both are writable through the single `PATCH` endpoint here.

**Data Storage** uses a plain JSON file to keep things simple for review. The `IDeviceRepository` interface means swapping to a real database only needs a single new file with no changes to the service layer. Unfortunately, the current `FileDeviceRepository` reads the full file on every operation (O(n)). An in-memory cache could improve this, but the expected migration path is to a real database (which provides O(1) indexed lookups) so the added complexity isn't worthwhile here.

**Observability** uses Pino logger. Every request gets a UUID trace ID and the error handler logs via `req.log` to correlate errors to the originating request.

## Future Improvements

**Separate authenticated endpoints for reported vs desired writes.** See the shadow state model above.

**Slow operations.** See the data storage section above.

**Connectivity management.** Currently `status` is a plain writable field. This doesn't reflect how connectivity works in practice where devices can go offline unexpectedly and the client cannot declare itself offline. An alternate method could be to have the device itself call a heartbeat endpoint periodically while running. The server stamps `lastSeenAt` on each call, and `status` is derived automatically. If a device that hasn't reported in within a configurable TTL is considered `offline`. This lets the server detect and log unexpected disconnects.

**Authentication and authorisation.** All endpoints are currently unauthenticated. In production, an API key or JWT middleware should be added. Per-device ownership would also let the authorisation layer prevent one user from modifying or deleting another's devices.

**Rate limiting.** With more time, rate limiting should be implemented since the endpoints are vulnerable to being flooded either maliciously or by a misconfigured device.

**Telemetry separation.** The device's latest confirmed state is overwritten on every update. Continuous sensor readings like temperature or motion events would be better stored as a time-series log. A dedicated POST telemetry endpoint could accept these high-frequency readings, with a corresponding GET endpoint for querying historical data for trend analysis or alerting.

**Pagination and filtering.**
Currently `GET /devices` returns all devices in one response, which could become unwieldy as the number of devices grows.

**Validation improvements.** More complex validation logic could be added to the service layer or via custom Zod refinements based on the device type and business logic e.g. temperature range min/max etc.

## Assumptions

- The client-supplied device ID at registration is unique, e.g. MAC address or serial number. If collisions are possible, server-generated UUIDs or a database-assigned ID could be assigned.
- All config fields for the device type are provided at registration. This becomes the initial `desired` state, with `delta` empty. In production, `reported` would fill in as the device comes online.
- Only one instance of the application should be running at a time. The file-backed store has no locking or coordination, so running multiple processes against the same file is unsafe.
