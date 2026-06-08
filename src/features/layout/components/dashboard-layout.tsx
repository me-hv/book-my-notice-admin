import { Sidebar } from "@/features/layout/components/sidebar";
import { TopNav } from "@/features/layout/components/top-nav";
import type { AdminSession } from "@/shared/lib/auth/session";

export function DashboardLayout({
  admin,
  children,
}: {
  admin: AdminSession;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav admin={admin} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
