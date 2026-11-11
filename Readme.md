# LMS Real-Time Leaderboard

A full-stack learning-management leaderboard where authenticated learners can complete tasks, earn XP, and see rank changes in real time.

## Tech stack

| Area | Technologies |
| --- | --- |
| Client | React 19, TypeScript, Vite, Axios, Socket.IO Client, CSS |
| Server | Node.js, TypeScript, Express 5, Socket.IO |
| Data | PostgreSQL (`pg`) and Redis (`ioredis`) |
| Authentication | JWT in HTTP-only cookies, `bcryptjs` password hashing |
| Validation and operations | Zod, Winston logging, CORS, cookie-parser, rate limiting |
| Real-time scaling | Socket.IO Redis adapter |

## Project structure

```text
.
├── client/                 # React single-page application
│   ├── src/api/            # API clients for auth, tasks, and leaderboard data
│   ├── src/components/     # Authentication, tasks, quiz, and leaderboard UI
│   └── vite.config.ts      # Development API and WebSocket proxy
├── server/                 # Express API and Socket.IO server
│   ├── src/route/          # Versioned REST endpoints
│   ├── src/service/        # Auth, XP, cache, snapshot, and leaderboard logic
│   ├── src/realtime/       # Authenticated Socket.IO configuration
│   └── sql_script/         # Database migrations and optional seed data
└── Readme.md
```

## Client

The client is a React + TypeScript SPA built with Vite. It provides registration and login, task completion (including quiz tasks), a paginated leaderboard, and live connection status.

- Axios calls the REST API and sends cookies with each request.
- Socket.IO listens for `leaderboard:updated` events and refreshes the leaderboard after an XP change.
- During local development, Vite proxies `/api` and `/socket.io` to the API server, so no client-side CORS setup is needed.

### Client configuration

Copy the example configuration and adjust it only if the server is not running on port `8001`:

```bash
cd client
cp .env.example .env
```

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_PROXY_TARGET` | API and Socket.IO target used by Vite's dev proxy | `http://localhost:8001` |
| `VITE_API_BASE_URL` | Optional direct API base URL, useful for deployed clients | `/api/v1` |

### Run the client

```bash
cd client
npm install
npm run dev
```

Vite prints the local application URL (normally `http://localhost:5173`). Create an account in the UI or log in with seeded development data if you loaded the optional seed script.

## Server

The server exposes a versioned REST API at `/api/v1` and shares its HTTP server with Socket.IO. It validates configuration at startup, applies pending SQL migrations, rebuilds the Redis leaderboard cache, starts snapshot/cache maintenance, and then listens for requests.

### Server responsibilities

- Registers users, logs them in, and stores the signed JWT in an HTTP-only `access_token` cookie.
- Protects task and leaderboard endpoints with JWT authentication.
- Records task-completion events and updates XP transactionally in PostgreSQL.
- Uses Redis for leaderboard caching, token revocation, and Socket.IO pub/sub.
- Broadcasts `leaderboard:updated` to authenticated connected clients after relevant updates.
- Supports global, neighbourhood, and historical snapshot leaderboard reads.

### API overview

All routes below are prefixed with `/api/v1`.

| Route | Description |
| --- | --- |
| `GET /health` | Reports PostgreSQL, Redis, and leaderboard-cache health. |
| `POST /auth/register` | Creates a user and sets an authentication cookie. |
| `POST /auth/login` | Authenticates a user and sets an authentication cookie. |
| `POST /auth/logout` | Revokes the current token and clears the cookie. |
| `GET /auth/me` | Returns the authenticated user. |
| `GET /tasks` | Lists tasks, including completion state for the current user. |
| `GET /tasks/:taskId` | Gets one task. |
| `POST /tasks/:taskId/complete` | Completes a task and awards XP. |
| `GET /leaderboard` | Returns a cursor-paginated global leaderboard. |
| `GET /leaderboard/me` | Returns entries around the current user's rank. |
| `GET /leaderboard/snapshots` | Returns a historical leaderboard snapshot. |

### Prerequisites

- Node.js 20 or newer with npm
- PostgreSQL with permission to create the `pgcrypto` extension
- Redis

### Server configuration

Copy the environment template, then supply real values for every required setting:

```bash
cd server
cp .env.example .env
```

Example development configuration:

```dotenv
NODE_ENV=development
PORT=8001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lms_leaderboard
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace-this-with-a-random-secret-at-least-32-characters-long
JWT_EXPIRES_IN=1h
# CORS_ORIGIN=http://localhost:5173
```

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | No | `development`, `test`, or `production`; defaults to `development`. |
| `PORT` | No | HTTP/Socket.IO port; defaults to `8001`. |
| `DATABASE_URL` | Yes | PostgreSQL connection URL. |
| `REDIS_URL` | Yes | Redis connection URL. |
| `JWT_SECRET` | Yes | Signing secret of at least 32 characters. |
| `JWT_EXPIRES_IN` | No | One of `15m`, `1h`, `8h`, or `1d`; defaults to `1h`. |
| `CORS_ORIGIN` | Recommended outside local development | Allowed client origin when the UI and API use different origins. |
| `TRUST_PROXY` | No | Number of trusted reverse proxies (0–10). |

### Database setup and optional seed data

Create the database before starting the server:

```bash
createdb lms_leaderboard
```

On first startup, the server automatically applies the versioned files in `server/sql_script/` and records them in `schema_migrations`. To populate sample users, tasks, XP events, and snapshots, run the optional seed script after migrations have been applied:

```bash
psql "$DATABASE_URL" -f sql_script/seed.sql
```

The seed file is intended for development only. Its sample accounts use the password `DevPassword123!`.

### Run the server

```bash
cd server
npm install
npm run dev
```

For a production-style build:

```bash
cd server
npm run build
npm start
```

Check the running service with:

```bash
curl http://localhost:8001/api/v1/health
```

## Run locally

Use two terminals after PostgreSQL and Redis are running:

```bash
# Terminal 1
cd server
npm install
npm run dev
```

```bash
# Terminal 2
cd client
npm install
npm run dev
```

Open the URL displayed by Vite, register a learner, and complete a task. Any authenticated browser session connected to the app receives the live leaderboard update.
