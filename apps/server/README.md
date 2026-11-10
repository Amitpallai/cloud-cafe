# Cloud Café POS API

The server is an Express 5 API backed by PostgreSQL through Prisma and the Neon
serverless adapter. It provides cookie-based authentication and the POS API used
by the client.

## Requirements

- Node.js and pnpm (use the versions supported by the repository)
- PostgreSQL/Neon database
- Cloudinary account for menu image uploads

## Configure

From the repository root, install dependencies:

```sh
pnpm install
```

Copy `apps/server/.env.example` to `apps/server/.env` and set the values:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `5000`. |
| `NODE_ENV` | Runtime environment: `development`, `test`, or `production`. |
| `CLIENT_URL` | Exact client origin allowed by CORS, such as `http://localhost:5173`. |
| `DATABASE_URL` | Pooled PostgreSQL URL used by the running API. |
| `DIRECT_URL` | Direct PostgreSQL URL used by Prisma commands such as migrations. |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens; use at least 32 characters. |
| `JWT_REFRESH_SECRET` | Different secret for refresh tokens; use at least 32 characters. |
| `OWNER_SETUP_SECRET` | One-time owner setup secret; use at least 32 characters. |
| `ACCESS_TOKEN_EXPIRES_IN` | Access-token lifetime; defaults to `15m`. |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh-token lifetime; defaults to `7d`. |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |
| `TAX_RATE_PERCENT` | Tax percentage used by the app; defaults to `0`. |
| `DEMO_ACCOUNTS_ENABLED` | Set to `true` to enable local demo login and account seeding. Defaults to `false`. |
| `DEMO_ACCOUNT_PASSWORD` | Shared password used when creating demo accounts; required only by the demo seeder and must be at least 12 characters. |

Keep `.env` files and all real credentials out of source control. Use distinct,
random authentication secrets and do not enable demo accounts in production.

## Run locally

Start the API in watch mode from the repository root:

```sh
pnpm --filter server dev
```

The API listens at `http://localhost:5000` by default. Check
`http://localhost:5000/health` for a health response. The client must use the
same API URL and its origin must match `CLIENT_URL`.

The first-time setup flow is exposed by the client. Use the `OWNER_SETUP_SECRET`
from the server environment to create the initial owner account.

## Deploy to Vercel

Create a Vercel project for the API and set its **Root Directory** to
`apps/server`. The included `vercel.json` installs development dependencies
needed for the TypeScript build and runs the server build command. Configure the
environment variables listed above in the Vercel project settings. Do not set
`DEMO_ACCOUNTS_ENABLED=true` in production.

The Express application is deployed as a Vercel Function. WebSocket connections
are not supported by this serverless deployment; use a separate persistent
server for features that require Socket.IO.

## Database

Prisma uses `prisma/schema.prisma`; `DIRECT_URL` supplies the migration
connection. Run checked-in migrations against the configured database with:

```sh
pnpm --filter server exec prisma migrate deploy
```

Regenerate the Prisma client after schema changes with:

```sh
pnpm --filter server exec prisma generate
```

Use migrations for schema changes; do not edit generated Prisma files directly.

## Demo accounts

Demo accounts are for local or other non-production environments only. Complete
owner setup first, then set `DEMO_ACCOUNTS_ENABLED=true` and provide a
`DEMO_ACCOUNT_PASSWORD` of at least 12 characters in `apps/server/.env`. Run
from the repository root:

```sh
pnpm --filter server demo:seed
```

The seeder creates these accounts with the shared password:

| Role | Email |
| --- | --- |
| Owner | `demo.owner@cloudcafe.test` |
| Manager | `demo.manager@cloudcafe.test` |
| Cashier | `demo.cashier@cloudcafe.test` |
| Kitchen | `demo.kitchen@cloudcafe.test` |
| Waiter | `demo.waiter@cloudcafe.test` |

The seeder refuses to run with `NODE_ENV=production` and does not overwrite
existing accounts. The guest demo login endpoint uses the seeded cashier and is
also disabled in production. Never use demo accounts or passwords for real
customer data.

## Scripts

Run commands from the repository root:

```sh
pnpm --filter server dev        # Start API in watch mode
pnpm --filter server build      # Compile/type-check the server
pnpm --filter server typecheck  # Type-check without emitting
pnpm --filter server demo:seed  # Create local demo accounts
```

## API overview

API routes are mounted under `/api`. The main route groups are authentication,
menu, tables, orders, kitchen, billing, and staff. Authenticated requests use
HTTP-only session cookies; state-changing requests are restricted to the
configured client origin.
