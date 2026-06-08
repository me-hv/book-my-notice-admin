import { redirect } from "next/navigation";

import { getCurrentAdmin } from "@/features/auth/lib/get-current-admin";
import { DashboardLayout } from "@/features/layout/components/dashboard-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/login");
  }

  return <DashboardLayout admin={admin}>{children}</DashboardLayout>;
}
