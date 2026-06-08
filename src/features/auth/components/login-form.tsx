"use client";

import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithEmailAndPassword } from "@/features/auth/lib/auth-client";
import { useAuth } from "@/hooks/useAuth";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21.6 12.23c0-.74-.07-1.45-.19-2.14H12v4.05h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.44Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.6A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.41 13.89a6.01 6.01 0 0 1 0-3.78v-2.6H3.07a10.01 10.01 0 0 0 0 8.98l3.34-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.99c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.61 9.61 0 0 0 12 2 9.99 9.99 0 0 0 3.07 7.51l3.34 2.6C7.2 7.75 9.4 5.99 12 5.99Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    admin,
    error: authError,
    googleLoading,
    loading: authLoading,
    clearError,
    loginWithGoogle,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nextUrl = searchParams.get("next") ?? "/dashboard";

  const loginMutation = useMutation({
    mutationFn: () => loginWithEmailAndPassword(email, password),
    onSuccess: () => {
      router.replace(nextUrl);
      router.refresh();
    },
  });

  const googleMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: () => {
      router.replace(nextUrl);
      router.refresh();
    },
  });

  const isAuthenticating =
    loginMutation.isPending || googleMutation.isPending || googleLoading;
  const errorMessage =
    loginMutation.isError || googleMutation.isError
      ? (loginMutation.error?.message ?? googleMutation.error?.message)
      : authError;

  useEffect(() => {
    if (!authLoading && admin) {
      router.replace(nextUrl);
      router.refresh();
    }
  }, [admin, authLoading, nextUrl, router]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    loginMutation.mutate();
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoComplete="email"
            className="h-11 pl-10"
            disabled={isAuthenticating}
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@bookmynotice.com"
            required
            type="email"
            value={email}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoComplete="current-password"
            className="h-11 pl-10"
            disabled={isAuthenticating}
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="flex gap-2 rounded-md border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        className="h-11 w-full"
        disabled={isAuthenticating}
        type="submit"
      >
        {loginMutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button
        className="h-11 w-full"
        disabled={isAuthenticating}
        onClick={() => {
          clearError();
          googleMutation.mutate();
        }}
        type="button"
        variant="outline"
      >
        {googleMutation.isPending || googleLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </Button>
    </form>
  );
}
