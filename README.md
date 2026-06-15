# Book My Notice Admin

Admin dashboard foundation for a newspaper advertisement booking platform.

## Repository Branch

The default branch for this repository is `master`.

Use `master` in deployment tools such as Vercel, Netlify, GitHub Actions, or local Git commands unless you intentionally rename the branch later.

Example:

```bash
git clone https://github.com/me-hv/book-my-notice-admin.git
cd book-my-notice-admin
git checkout master
```

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Firebase Authentication
- Firebase Firestore
- Cloudflare R2
- TanStack Query
- Lucide Icons

## Folder Structure

```txt
src/
  app/
    (auth)/login/             Public login route
    (admin)/                  Protected dashboard route group
    api/auth/                 Session creation and logout route handlers
    providers.tsx             React Query and shared app providers
  features/
    auth/                     Login, logout, current admin helpers
    bookings/                 Booking repository module
    customers/                Customer repository module
    dashboard/                Dashboard overview components
    layout/                   Sidebar, top nav, admin layout shell
    newspapers/               Newspaper repository module
    pricing/                  Pricing rule repository module
  shared/
    components/               Reusable page and state components
    constants/                Route and navigation definitions
    lib/
      auth/                   Signed admin session helpers
      firebase/               Client and Admin SDK initialization
      r2/                     Cloudflare R2 S3-compatible client
    repositories/             Base and Firestore repository abstractions
    types/                    Type-safe Firestore collection models
```

## Authentication Flow

1. Staff opens `/login`.
2. The login form uses Firebase Email/Password Auth.
3. The Firebase ID token is posted to `/api/auth/session`.
4. The API verifies the token with Firebase Admin SDK.
5. The API reads `adminUsers/{uid}` from Firestore.
6. Only active admin users with an allowed role receive an HTTP-only signed session cookie.
7. Middleware protects `/dashboard`, `/bookings`, `/customers`, `/newspapers`, `/pricing`, and `/settings`.

Expected Firestore admin document:

```json
{
  "email": "admin@bookmynotice.com",
  "role": "SUPER_ADMIN",
  "active": true
}
```

## Environment

Copy `.env.example` to `.env.local` and fill the values.

```bash
cp .env.example .env.local
```

For Firebase Admin, use either:

- `FIREBASE_SERVICE_ACCOUNT_KEY` as base64 encoded service account JSON
- Or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`

`ADMIN_SESSION_SECRET` should be a long random string used to sign admin session cookies.

## Deployment Checklist

Before deploying, set these environment variables in your hosting provider:

- Public Firebase keys: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
- Firebase Admin credentials: `FIREBASE_SERVICE_ACCOUNT_KEY` or `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Session signing key: `ADMIN_SESSION_SECRET`
- Cloudflare R2 keys: `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`

Recommended build command:

```bash
npm run build
```

If deployment fails with Turbopack-related build issues, temporarily change the build script from `next build --turbopack` to `next build` and redeploy.

## Firestore Collections

Type definitions live in `src/shared/types/firestore.ts`.

- `users`
- `bookings`
- `adminUsers`
- `newspapers`
- `pricingRules`

Repository abstractions live in `src/shared/repositories`. Feature repositories compose the shared Firestore repository so future pages can add pagination, filters, and mutations without coupling UI to Firebase SDK calls.

## Current Scope

Implemented foundation only:

- Project setup
- Firebase integration
- Authentication flow
- Admin role verification
- Protected routes
- Dashboard layout
- Sidebar and top navigation
- Empty dashboard pages
- Type-safe Firestore models
- Repository pattern
- Cloudflare R2 client setup

Not implemented yet:

- Payment systems
- Invoices
- Analytics
- Publication workflows
- Production booking tables or mutations
