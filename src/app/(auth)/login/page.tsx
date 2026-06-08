import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-muted/30 px-4 py-8 lg:grid-cols-[1fr_480px] lg:p-0">
      <section className="hidden border-r bg-white p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            BM
          </div>
          <div>
            <p className="font-semibold">Book My Notice</p>
            <p className="text-sm text-muted-foreground">Admin Console</p>
          </div>
        </div>
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary">
            Newspaper advertisement operations
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Manage bookings with clarity, control, and accountability.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            A secure workspace for staff to review customer submissions,
            verify access, and maintain the core advertisement booking system.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Authorized staff access only
        </p>
      </section>

      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use your Firebase email and password admin account.
            </p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
