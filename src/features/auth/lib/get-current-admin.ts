import { cookies } from "next/headers";

import {
  AUTH_COOKIE_NAME,
  verifyAdminSessionToken,
} from "@/shared/lib/auth/session";

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  return verifyAdminSessionToken(token);
}
