# Cloud Café POS client

The client is a responsive React 19 + TypeScript single-page application built with Vite, Tailwind CSS v4, shadcn/ui (Base UI), React Router, and Zustand. It talks to the Express API using cookie-based sessions.

## Run locally

1. Start the server and configure its environment as described in `../server/.env.example`.
2. From `apps/client`, install dependencies and start Vite:

   ```sh
   pnpm install
   pnpm dev
   ```

3. Set `VITE_API_URL` in `.env` if the API is not at `http://localhost:5000/api`.
4. Open `http://localhost:5173`. On the first run, use **Create owner account** and provide the server's one-time `OWNER_SETUP_SECRET`.

The server's `CLIENT_URL` must match the browser origin (the default is `http://localhost:5173`) to allow credentialed API requests.

## Demo accounts

Demo accounts are opt-in and intended only for a non-production database. Set
`DEMO_ACCOUNTS_ENABLED=true` and a `DEMO_ACCOUNT_PASSWORD` of at least 12
characters in the server environment, then run `pnpm --filter server demo:seed`
from the repository root. The seed command refuses to run in production and
does not change accounts that already exist.
Complete the normal owner setup before seeding; the demo owner also counts as an
owner for the one-time setup check.
In a development client, the login page shows role shortcuts and **Login as
guest demo**, which signs in directly as the seeded cashier demo account. This
shortcut is rejected by the server in production.

The shortcuts fill the demo account email; users still need to enter the shared
password. Accounts use `demo.<role>@cloudcafe.test` for owner, manager, cashier,
kitchen, and waiter. Keep these accounts and credentials out of production.

## Client features

- Cookie-backed login, session refresh, logout, and one-time owner setup
- Role-aware navigation and protected views
- POS cart, table assignment, and order creation
- Order queue, kitchen dispatch, cancellation, and billing
- Partial/full payment recording, discounts, and printable receipts
- Table availability management, menu/category management, and staff administration
- Kitchen ticket board with automatic refresh

## Structure

- `src/app` — application routes and access guards
- `src/components` — shared layout and shadcn-style UI primitives
- `src/features` — auth, dashboard, POS, orders, billing, tables, kitchen, menu, and staff screens
- `src/services` — API client and typed endpoint functions
- `src/stores` — Zustand auth/session and cart state
- `src/types` — API domain types
- `src/lib` — shared formatting, error, and class utilities

## Checks

```sh
pnpm build
pnpm lint
```

The project is initialized with the requested shadcn preset and the Vite template to match the existing client framework.
