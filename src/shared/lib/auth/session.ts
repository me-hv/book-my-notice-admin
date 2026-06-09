import { SignJWT, jwtVerify } from "jose";

import { AUTH_COOKIE_NAME } from "@/shared/constants/routes";
import type { AdminRole } from "@/shared/types/firestore";

export { AUTH_COOKIE_NAME };

export type AdminSession = {
  uid: string;
  email: string;
  role: AdminRole;
  active: true;
};

const SESSION_ISSUER = "book-my-notice-admin";
const SESSION_AUDIENCE = "book-my-notice-staff";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret && process.env.NODE_ENV === "development") {
    // TODO: Restore adminUsers role verification before production.
    return new TextEncoder().encode(
      "book-my-notice-local-development-session-secret",
    );
  }

  if (!secret) {
    return null;
  }

  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(session: AdminSession) {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET.");
  }

  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAdminSessionToken(
  token?: string,
): Promise<AdminSession | null> {
  const secret = getSessionSecret();

  if (!secret || !token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });

    if (
      typeof payload.uid !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      payload.active !== true
    ) {
      return null;
    }

    return {
      uid: payload.uid,
      email: payload.email,
      role: payload.role as AdminRole,
      active: true,
    };
  } catch {
    return null;
  }
}

export const sessionMaxAge = SESSION_TTL_SECONDS;
