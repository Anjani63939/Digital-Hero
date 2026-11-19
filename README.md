# Digital Heroes Printworks

A mobile-first web-to-print storefront with a React interface and Node.js serverless API, structured for Vercel deployment. The experience includes six parameter-driven product divisions, live pricing, an in-browser proof mock-up, customer orders and reorder, a role-aware production dashboard, server-generated PDFs, and CSV-to-PDF variable-data output.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`, then open the local Vite URL.
4. The storefront, instant calculator, sample customer account, proof flow, and sample production pipeline work in browser-only demo mode without external credentials. Demo orders are stored in that browser, not in a server database.
   - Customer demo: `customer@example.test` / any password of 8+ characters.
   - Studio demo: `admin@example.test` / any password of 8+ characters.
   - Demo credentials are not valid after Supabase is connected.
5. To use the Node API locally, run `vercel dev` after setting up the environment variables below.

## Persistent accounts and orders

1. Create a **new Supabase project**.
2. Run [`database/schema.sql`](./database/schema.sql) in its SQL editor. This creates the customer profile trigger, product catalog, orders, saved designs, and row-level security policies.
3. In the Vercel project settings, set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `APP_URL`. Keep the service-role key private; never use it in a `VITE_` variable.
4. Configure Supabase Auth email confirmation and allowed redirect URLs for your Vercel domain.
5. Redeploy after setting environment variables. In a connected deployment, customers sign up or sign in before creating persistent orders.
6. To enable paid checkout, configure a Stripe account, set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `APP_URL`, then register `https://<your-domain>/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Customers are charged only after approving their proof. Without Stripe, persistent orders are recorded as payment-pending; no real charge is made.
7. To make a studio administrator, set that user's `profiles.role` to `admin` in Supabase. Customer accounts cannot change their own role.

## Deploy to a new Vercel project

1. Create a new Git repository and push this project to it.
2. Import that repository into a **new Vercel account/project** as required by the assignment.
3. Use the default build command `npm run build`; Vercel detects the React/Vite output in `dist`. The `api/index.js` Node.js function serves the backend.
4. Set the server-only environment variables above in Vercel and redeploy.
5. Set the matching application URL and Supabase Auth site URL/redirect URLs to the deployed HTTPS origin.
6. Verify `/api`, registration/login, product pricing, an authenticated order, proof approval, and administrator-only production downloads on the deployed site.

## API

- `GET /api` — service readiness and integration configuration.
- `GET /api/products` — the parameter-driven product catalog.
- `POST /api/pricing` — validated quote calculation, bulk discount, and 18% GST.
- `POST /api/auth/register`, `POST /api/auth/login` — Supabase Auth.
- `GET /api/me`, `GET /api/designs`, `POST /api/designs` — authenticated account and saved artwork.
- `GET /api/orders`, `POST /api/orders` — authenticated customer orders (admins can see all orders).
- `POST /api/orders/:id/proof` — approve a proof or request a new version.
- `POST /api/orders/:id/checkout` — Stripe checkout after proof approval.
- `POST /api/stripe/webhook` — verifies Stripe events and advances paid jobs into production.
- `PATCH /api/orders/:id/status` — administrator pipeline update; production requires an approved proof.
- `GET /api/orders/:id/files` — administrator-only ZIP containing a vector PDF and 300-DPI PNG after proof approval.
- `POST /api/orders/:id/variable-data` — administrator-only ZIP of per-row production PDFs (1–100 rows) from CSV.
- `GET /api/reports` — administrator-only order and revenue summary.

All amounts are represented in INR and use 18% GST as the sample pricing rule. Configure the actual business tax, material price adjustments, shipping, and payment policy before launch. The artwork preview is an interactive proof mock-up; uploaded file names are not stored as production assets. Add private object storage and a real artwork-rendering workflow before accepting customer-supplied final print files. Email notifications also need an explicitly chosen and configured mail provider before production launch.
