import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  createAdminSessionToken,
  sessionMaxAge,
} from "@/shared/lib/auth/session";
import {
  FirestoreRestError,
  getAdminUserWithUserToken,
} from "@/shared/lib/firebase/firestore-rest";
import { getAdminAuth, getAdminFirestore } from "@/shared/lib/firebase/admin";
import { verifyFirebaseIdTokenWithRest } from "@/shared/lib/firebase/token-verification";
import type { AdminRole, AdminUserDocument } from "@/shared/types/firestore";

const allowedRoles: AdminRole[] = [
  "SUPER_ADMIN",
  "MANAGER",
  "OPERATOR",
  "SUPPORT",
  "ADMIN",
  "OPERATIONS",
  "VIEWER",
];

export const runtime = "nodejs";

function logAdminVerification(message: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Admin session verification] ${message}`, details);
  }
}

function logAdminVerificationError(
  message: string,
  error: unknown,
  details: Record<string, unknown> = {},
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error(`[Admin session verification] ${message}`, {
    ...details,
    code:
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : error instanceof FirestoreRestError
          ? error.code
          : "unknown",
    message: error instanceof Error ? error.message : "Unknown error",
  });
}

async function verifyUserAndReadAdmin(idToken: string) {
  if (process.env.NODE_ENV === "development") {
    const verifiedUser = await verifyFirebaseIdTokenWithRest(idToken);

    logAdminVerification(
      "TODO: Restore adminUsers role verification before production.",
      {
        uid: verifiedUser.uid,
        email: verifiedUser.email,
        bypass: "server-adminUsers-check",
      },
    );

    return {
      uid: verifiedUser.uid,
      email: verifiedUser.email,
      admin: {
        uid: verifiedUser.uid,
        email: verifiedUser.email ?? "local-admin@bookmynotice.dev",
        role: "SUPER_ADMIN",
        active: true,
      } satisfies AdminUserDocument,
    };
  }

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    logAdminVerification("authenticated user", {
      uid: decodedToken.uid,
      email: decodedToken.email,
      source: "firebase-admin",
    });

    const adminSnapshot = await getAdminFirestore()
      .collection("adminUsers")
      .doc(decodedToken.uid)
      .get();

    logAdminVerification("admin document read", {
      path: `adminUsers/${decodedToken.uid}`,
      exists: adminSnapshot.exists,
      source: "firebase-admin",
    });

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
      admin: adminSnapshot.exists
        ? (adminSnapshot.data() as AdminUserDocument)
        : null,
    };
  } catch (error) {
    logAdminVerificationError(
      "Firebase Admin verification failed; using REST fallback",
      error,
    );
  }

  const verifiedUser = await verifyFirebaseIdTokenWithRest(idToken);
  logAdminVerification("authenticated user", {
    uid: verifiedUser.uid,
    email: verifiedUser.email,
    source: "firebase-rest",
  });

  try {
    const admin = await getAdminUserWithUserToken(idToken, verifiedUser.uid);
    logAdminVerification("admin document read", {
      path: `adminUsers/${verifiedUser.uid}`,
      exists: Boolean(admin),
      source: "firestore-rest",
    });

    return {
      uid: verifiedUser.uid,
      email: verifiedUser.email,
      admin,
    };
  } catch (error) {
    logAdminVerificationError("Firestore adminUsers read failed", error, {
      path: `adminUsers/${verifiedUser.uid}`,
      source: "firestore-rest",
    });
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { idToken?: string };

    if (!body.idToken) {
      return NextResponse.json(
        { message: "Firebase ID token is required." },
        { status: 400 },
      );
    }

    const verified = await verifyUserAndReadAdmin(body.idToken);

    if (!verified.admin) {
      return NextResponse.json(
        { message: "You do not have administrator access." },
        { status: 403 },
      );
    }

    const admin = verified.admin;

    if (!admin.active) {
      return NextResponse.json(
        { message: "Your administrator account has been disabled." },
        { status: 403 },
      );
    }

    if (
      admin.email.toLowerCase() !== verified.email?.toLowerCase() ||
      !allowedRoles.includes(admin.role)
    ) {
      return NextResponse.json(
        { message: "You do not have administrator access." },
        { status: 403 },
      );
    }

    const token = await createAdminSessionToken({
      uid: verified.uid,
      email: admin.email,
      role: admin.role,
      active: true,
    });

    const response = NextResponse.json({
      admin: {
        uid: verified.uid,
        email: admin.email,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionMaxAge,
    });

    return response;
  } catch (error) {
    logAdminVerificationError("Unable to verify admin credentials", error);

    return NextResponse.json(
      { message: "Unable to verify admin credentials." },
      { status: 401 },
    );
  }
}
