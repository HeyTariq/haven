# Haven

A self-hosted household management app. Haven runs as a single Docker container backed by SQLite, built with Next.js 16 (App Router) and React 19.

Each feature is a self-contained module: a household can enable the ones it needs, and every module contributes a dashboard widget and a sidebar entry. Records that members may want to keep to themselves carry per-member visibility, so private items stay private even from admins.

## Features

- **Module system** — features live under `src/modules/<id>/` and register themselves with the registry that drives the sidebar nav and settings toggles.
- **Per-member privacy** — a shared visibility primitive lets records be `shared` or `private`. Admins can manage shared records but cannot read or write another member's private ones.
- **Customizable dashboard** — every module ships a widget on a draggable 12-column grid.
- **Admin-managed accounts** — public self-registration is disabled. The first run creates an admin via `/setup`; admins create everyone else.

## Quick start (Docker)

You'll need [Docker](https://docs.docker.com/get-started/get-docker/) installed and running. On Linux, make sure your user is in the `docker` group (`sudo usermod -aG docker $USER`, then re-login) so you can run Docker without `sudo`.

```bash
mkdir -p data
cp .env.example .env
# edit .env and set BETTER_AUTH_SECRET to a 32-byte secret
#   e.g. openssl rand -base64 32

docker compose up --build
```

Open http://localhost:3000 from the host machine. To access from another device on your network, use `http://<host-ip>:3000` (find your host IP with `ip a` on Linux or `ipconfig` on Windows). On first run, visit `/setup` to create the admin account. The `data/` directory is a volume mount that holds the SQLite database; migrations run automatically at container start.

## Local development

```bash
npm install
mkdir -p data
cp .env.example .env   # set BETTER_AUTH_SECRET
npm run db:migrate     # create database tables (required on first run)
npm run dev            # start dev server (Turbopack) on :3000
```

Scripts:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations from schema changes |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio |

Type-check without emitting: `npx tsc --noEmit`.

## Environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_PATH` | SQLite file path (default `./data/data.db`) |
| `BETTER_AUTH_SECRET` | 32-byte secret used by Better Auth (required) |
| `BETTER_AUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `TRUSTED_ORIGINS` | Comma-separated LAN IPs for cross-device login (optional) |

## Architecture

- **Route groups** — `(auth)` for unauthenticated pages (`/setup`, `/login`), `(app)` for the authenticated shell with sidebar nav, and `api/auth/[...all]` for the Better Auth handler.
- **Auth** (`src/lib/auth/`) — Better Auth with email/password and an admin plugin, on a Drizzle/SQLite adapter. Server-side guards (`requireUser`, `requireAdmin`) live here, alongside the visibility primitive.
- **Modules** (`src/modules/`, `src/lib/modules/registry.ts`) — each module defines its schema, server actions, visibility-filtered queries, a route page, and a required dashboard widget.
- **Database** (`src/lib/db/`) — better-sqlite3 in WAL mode with foreign keys on; schema defined with Drizzle. Migrations run automatically at container start (Docker) or via `npm run db:migrate` locally.
- **Middleware** (`src/proxy.ts`) — redirects unauthenticated requests to `/login`.

## License

See the `LICENSE` file.
