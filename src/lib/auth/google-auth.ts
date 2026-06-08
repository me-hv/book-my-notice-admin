"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { getFirebaseClient } from "@/shared/lib/firebase/client";
import type { AdminRole, AdminUserDocument } from "@/shared/types/firestore";

export type AuthenticatedAdmin = {
  uid: string;
  email: string;
  role: AdminRole;
};

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

function isNonProductionRuntime() {
  return process.env.NODE_ENV !== "production";
}

async function createAdminServerSession(user: User) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(payload?.message ?? "Unable to create admin session.");
  }
}

export async function getActiveAdminForUser(
  user: User,
): Promise<AuthenticatedAdmin> {
  const { db, auth } = getFirebaseClient();

  if (isNonProductionRuntime()) {
    console.warn(
      "TODO: Restore adminUsers role verification before production.",
      {
        uid: user.uid,
        email: user.email,
        bypass: "client-adminUsers-check",
      },
    );

    return {
      uid: user.uid,
      email: user.email ?? "local-admin@bookmynotice.dev",
      role: "SUPER_ADMIN",
    };
  }

  const adminRef = doc(db, "adminUsers", user.uid);

  if (isNonProductionRuntime()) {
    console.log("[Admin verification]", {
      uid: user.uid,
      email: user.email,
      path: `adminUsers/${user.uid}`,
    });
  }

  let adminSnapshot;

  try {
    adminSnapshot = await getDoc(adminRef);
  } catch (error) {
    if (isNonProductionRuntime()) {
      console.error("[Admin verification] Firestore read failed", {
        code:
          typeof error === "object" && error && "code" in error
            ? String(error.code)
            : "unknown",
        message:
          error instanceof Error ? error.message : "Unknown Firestore error",
      });
    }

    await signOut(auth);
    throw new Error("Unable to verify admin credentials.");
  }

  if (isNonProductionRuntime()) {
    console.log("[Admin verification]", {
      path: `adminUsers/${user.uid}`,
      exists: adminSnapshot.exists(),
    });
  }

  if (!adminSnapshot.exists()) {
    await signOut(auth);
    throw new Error("You do not have administrator access.");
  }

  const admin = adminSnapshot.data() as AdminUserDocument;

  if (!admin.active) {
    await signOut(auth);
    throw new Error("Your administrator account has been disabled.");
  }

  if (!user.email || admin.email.toLowerCase() !== user.email.toLowerCase()) {
    await signOut(auth);
    throw new Error("You do not have administrator access.");
  }

  return {
    uid: user.uid,
    email: admin.email,
    role: admin.role,
  };
}

export async function signInWithGoogle(): Promise<AuthenticatedAdmin> {
  const { auth } = getFirebaseClient();
  const credential = await signInWithPopup(auth, googleProvider);
  const admin = await getActiveAdminForUser(credential.user);

  await createAdminServerSession(credential.user);

  return admin;
}

export async function restoreAdminSession(
  user: User,
): Promise<AuthenticatedAdmin> {
  const admin = await getActiveAdminForUser(user);

  await createAdminServerSession(user);

  return admin;
}
