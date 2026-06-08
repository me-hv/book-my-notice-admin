# Firebase Setup Guide

Use this checklist before running the Book My Notice Admin dashboard locally.

## Developer Checklist

- [ ] Create or select the Firebase project for Book My Notice.
- [ ] Register a Firebase Web app for the admin dashboard.
- [ ] Copy all `NEXT_PUBLIC_FIREBASE_*` values into `.env.local`.
- [ ] Enable Firebase Authentication with Email/Password sign-in.
- [ ] Enable Firebase Authentication with Google sign-in.
- [ ] Add local and production domains to Firebase Authentication authorized domains.
- [ ] Create the Firestore database.
- [ ] Create the required Firestore collections: `users`, `bookings`, `adminUsers`, `newspapers`, `pricingRules`.
- [ ] Add at least one active admin document under `adminUsers/{uid}`.
- [ ] Configure Cloudflare R2 placeholders in `.env.local`.
- [ ] Restart the Next.js dev server after changing environment variables.

## Firebase Values

Create `.env.local` from `.env.local.example`, then fill these values from Firebase Console.

### `NEXT_PUBLIC_FIREBASE_API_KEY`

Where to find it:

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Select the Book My Notice Firebase project.
3. Click the gear icon beside **Project Overview**.
4. Open **Project settings**.
5. In **General**, scroll to **Your apps**.
6. Select the Web app used for this admin dashboard.
7. In **SDK setup and configuration**, copy `apiKey`.

### `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`

Where to find it:

1. Open **Project settings**.
2. Go to **General**.
3. Scroll to **Your apps**.
4. Select the Web app.
5. In **SDK setup and configuration**, copy `authDomain`.

This usually looks like:

```txt
your-project-id.firebaseapp.com
```

### `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

Where to find it:

1. Open **Project settings**.
2. Go to **General**.
3. In **Project information**, copy **Project ID**.

The same value also appears as `projectId` inside the Web app SDK configuration.

### `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

Where to find it:

1. Open **Project settings**.
2. Go to **General**.
3. Scroll to **Your apps**.
4. Select the Web app.
5. In **SDK setup and configuration**, copy `storageBucket`.

This value is included for Firebase app initialization. Booking documents in this project are intended to use Cloudflare R2.

### `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

Where to find it:

1. Open **Project settings**.
2. Go to **General**.
3. Scroll to **Your apps**.
4. Select the Web app.
5. In **SDK setup and configuration**, copy `messagingSenderId`.

### `NEXT_PUBLIC_FIREBASE_APP_ID`

Where to find it:

1. Open **Project settings**.
2. Go to **General**.
3. Scroll to **Your apps**.
4. Select the Web app.
5. In **SDK setup and configuration**, copy `appId`.

## Enable Firebase Authentication

1. In Firebase Console, open **Build > Authentication**.
2. Click **Get started** if Authentication is not initialized.
3. Open the **Sign-in method** tab.
4. Select **Email/Password**.
5. Enable **Email/Password**.
6. Save changes.

The admin dashboard login form uses Firebase Email/Password authentication.

## Enable Google Authentication

1. In Firebase Console, open **Build > Authentication**.
2. Open the **Sign-in method** tab.
3. Select **Google**.
4. Enable the Google provider.
5. Choose the support email shown to administrators during Google sign-in.
6. Save changes.

The dashboard uses Firebase `GoogleAuthProvider` with popup login for the **Continue with Google** button.

## Add Authorized Domains

1. In Firebase Console, open **Build > Authentication**.
2. Open **Settings**.
3. Go to **Authorized domains**.
4. Confirm these domains are present for local development:

```txt
localhost
127.0.0.1
```

5. Add the production admin dashboard domain before deployment.

Google popup authentication will fail if the current domain is not listed here.

## Create Firestore

1. In Firebase Console, open **Build > Firestore Database**.
2. Click **Create database**.
3. Choose the production mode appropriate for your environment.
4. Select the Firestore region closest to your users and operations team.
5. Create the database.

Required collections:

```txt
users
bookings
adminUsers
newspapers
pricingRules
```

## Create an Admin User

1. In Firebase Console, open **Build > Authentication > Users**.
2. Add a user with email and password, or use an existing staff user.
3. Copy the user's Firebase `uid`.
4. Open **Build > Firestore Database**.
5. Create a document at:

```txt
adminUsers/{uid}
```

Example document:

```json
{
  "email": "admin@bookmynotice.com",
  "role": "SUPER_ADMIN",
  "active": true
}
```

Only users with an `adminUsers/{uid}` document where `active` is `true` can access protected dashboard routes.

## Cloudflare R2 Placeholders

These values do not come from Firebase. They are included in `.env.local.example` because booking documents will be stored in Cloudflare R2.

### `R2_ACCOUNT_ID`

Where to find it:

1. Open the Cloudflare Dashboard.
2. Select your account.
3. Copy **Account ID** from the account overview/sidebar.

### `R2_ACCESS_KEY_ID`

Where to find it:

1. Open **R2 Object Storage**.
2. Go to **Manage R2 API tokens**.
3. Create an API token with access to the document bucket.
4. Copy the generated access key ID.

### `R2_SECRET_ACCESS_KEY`

Where to find it:

1. Create an R2 API token.
2. Copy the secret access key when Cloudflare shows it.
3. Store it immediately; Cloudflare will not show it again.

### `R2_BUCKET_NAME`

Where to find it:

1. Open **R2 Object Storage**.
2. Open **Buckets**.
3. Copy the bucket name used for booking documents.

### `R2_PUBLIC_URL`

Where to find it:

1. Open the R2 bucket.
2. Go to **Settings**.
3. Use the configured public access URL or custom domain if public access is enabled.

Use a private signed URL flow instead of `R2_PUBLIC_URL` for confidential customer documents.
