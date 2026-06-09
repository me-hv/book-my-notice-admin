"use client";

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { writeAuditLog } from "@/features/settings/repositories/settingsRepository";
import { getFirebaseClient } from "@/shared/lib/firebase/client";

export async function loginWithEmailAndPassword(
  email: string,
  password: string,
) {
  const { auth } = getFirebaseClient();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();

  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    await firebaseSignOut(auth);
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(payload?.message ?? "Unable to create admin session.");
  }

  const payload = (await response.json()) as {
    admin: {
      uid: string;
      email: string;
      role: string;
    };
  };

  await writeAuditLog({
    actorEmail: payload.admin.email,
    eventType: "LOGIN",
    targetType: "adminUsers",
    targetId: payload.admin.uid,
    message: "Admin signed in with email and password",
  });

  return payload;
}

export async function logoutAdmin() {
  const { auth } = getFirebaseClient();

  await Promise.allSettled([
    firebaseSignOut(auth),
    fetch("/api/auth/logout", {
      method: "POST",
    }),
  ]);
}
