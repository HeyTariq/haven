<div align="center">

# Haven

### The self-hosted home for everything your household shares.

Shopping lists, chores, and a family bulletin, in one private app you run yourself.<br/>
One container. One database file. Zero cloud accounts.

[![CI](https://github.com/HeyTariq/haven/actions/workflows/ci.yml/badge.svg)](https://github.com/HeyTariq/haven/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL-003b57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Docker Ready](https://img.shields.io/badge/Docker-ready-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

[Quick start](#quick-start) · [Features](#features) · [Configuration](#configuration) · [Architecture](#architecture) · [Contributing](#contributing)

</div>

---

## Why Haven?

Most household apps want your data, your subscription, and an internet connection. Haven wants none of that. It's a single Docker container backed by one SQLite file. Point it at a folder, open it on your network, and your household's lists and routines live entirely on hardware you control.

It's built to grow with you. Every feature is a **self-registering module**, so the app you run is the app you actually need, with no dead menus and no bloat.

## Features

- **Modular by design.** Each feature is a drop-in module under `src/modules/<id>/`. Modules register themselves and automatically wire up their nav entry, settings toggle, and dashboard widget. Ships with **Shopping**, **Chores**, and a **Bulletin** board.
- **Per-member privacy.** Records can be `shared` or `private`. A shared visibility primitive enforces it everywhere: admins manage shared data but **cannot read or write another member's private records**.
- **A dashboard that's yours.** Every module contributes a widget to a draggable 12-column grid. Arrange it once, see what matters at a glance.
- **Passwordless sign-in.** The login screen is a profile picker: tap your avatar and you're in. Add an optional PIN for extra protection (admins always require one), and let trusted devices remember a profile for one-tap entry.
- **Admin-managed accounts.** Public sign-up is off by design. The first run creates an admin via `/setup`; admins onboard everyone else.
- **Truly self-hosted.** One container, one volume, automatic migrations on start. No external services, no telemetry, no accounts.

## Quick start

> **Prerequisite:** [Docker](https://docs.docker.com/get-started/get-docker/) installed and running. On Linux, add your user to the `docker` group (`sudo usermod -aG docker $USER`, then re-login) to run Docker without `sudo`.

```bash
git clone https://github.com/HeyTariq/haven.git
cd haven

mkdir -p data
cp .env.example .env
# Set BETTER_AUTH_SECRET to a 32-byte secret, e.g.:
#   openssl rand -base64 32

docker compose up --build
```

Then:

1. Open **http://localhost:3000** on the host. From another device on your network, use `http://<host-ip>:3000` (find the IP with `ip a` on Linux or `ipconfig` on Windows).
2. Visit **`/setup`** to create the admin account.
3. Invite your household from the admin panel.

The `data/` directory is a volume mount holding the SQLite database. Migrations run automatically on container start.

> **Tip:** Give the server a fixed LAN IP (a DHCP reservation in your router) so everyone uses one stable address, and remember to list it in [`TRUSTED_ORIGINS`](#trusted_origins).

## Local development

```bash
npm install
mkdir -p data
cp .env.example .env   # set BETTER_AUTH_SECRET
npm run db:migrate     # create database tables (required on first run)
npm run dev            # Turbopack dev server on :3000
```

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Drizzle migrations from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npx tsc --noEmit` | Type-check only |

**Adding a schema change:** edit the Drizzle schema, run `npm run db:generate`, then `npm run db:migrate`.

## Configuration

| Variable | Required | Description |
| --- | :---: | --- |
| `BETTER_AUTH_SECRET` | Yes | 32-byte secret used by Better Auth (app refuses to start on a placeholder) |
| `BETTER_AUTH_URL` | | Base URL of the app (e.g. `http://localhost:3000`) |
| `DATABASE_PATH` | | SQLite file path (default `./data/data.db`) |
| `TRUSTED_ORIGINS` | | Comma-separated CSRF allowlist (see below) |

### `TRUSTED_ORIGINS`

This is a **security** setting, not a network one. It does *not* decide who on your network can reach the app. Anyone who can open the page can, by design, because the login screen is what guards access. Instead, it lists the addresses the app is *served from* (the URLs users type into their browser) that are allowed to send login requests. This blocks a malicious site open in another tab from hijacking a logged-in session (a CSRF attack).

Because a browser treats `http://localhost:3000`, `http://192.168.1.100:3000`, and `http://haven.local:3000` as three different origins, list every address you actually use, comma-separated:

```ini
TRUSTED_ORIGINS=http://localhost:3000,http://192.168.1.100:3000
```

> **Caution:** Avoid `"*"`. It disables the check entirely and lets any website talk to your auth API.

## Architecture

Haven is a **single Docker container**: Next.js 16 (App Router) + React 19 on the front, better-sqlite3 (WAL mode, foreign keys on) on the back, with [Better Auth](https://www.better-auth.com/) and [Drizzle ORM](https://orm.drizzle.team/) in between.

| Layer | What it does |
| --- | --- |
| **Modules** (`src/modules/`) | Each module owns its schema, server actions, visibility-filtered queries, route page, and dashboard widget, and self-registers with `src/lib/modules/registry.ts`. |
| **Auth** (`src/lib/auth/`) | Better Auth on the Drizzle/SQLite adapter with the admin plugin and a custom passwordless plugin. Email/password is disabled; sign-in mints a session from a profile plus an optional PIN, verified server-side. `requireUser` / `requireAdmin` guards live here, alongside the visibility primitive. |
| **Database** (`src/lib/db/`) | better-sqlite3 in WAL mode, schema defined with Drizzle. Migrations run automatically at container start (or `npm run db:migrate` locally). |
| **Routes** | `(auth)` for unauthenticated pages (`/setup`, `/login`), `(app)` for the authenticated shell with sidebar nav, and `api/auth/[...all]` for the Better Auth handler. |
| **Proxy** (`src/proxy.ts`) | Next.js 16 proxy (the rename of "middleware"); redirects unauthenticated requests to `/login`. |

**Built with:** Next.js · React · TypeScript · Tailwind CSS v4 · Drizzle ORM · Better Auth · better-sqlite3 · Zod · Base UI · Lucide.

## Contributing

Contributions are welcome. The fastest way to add a feature is to write a new module; see [`CLAUDE.md`](CLAUDE.md) for the module contract and the patterns to follow. Open an issue to discuss larger changes first, run `npm run lint` and `npx tsc --noEmit` before opening a PR, and keep modules self-contained.

## License

See the [`LICENSE`](LICENSE) file.
