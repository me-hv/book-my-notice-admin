import { AdminShell } from "@/components/layout/AdminShell";
import type { AdminSession } from "@/shared/lib/auth/session";

export function DashboardLayout({
  admin,
  children,
}: {
  admin: AdminSession;
  children: React.ReactNode;
}) {
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
