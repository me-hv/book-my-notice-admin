import { PageHeader } from "@/shared/components/page-header";
import { OverviewCards } from "@/features/dashboard/components/overview-cards";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        badge="Overview"
        description="Monitor bookings, pricing, payment, and publication readiness from one operations command center."
        title="Operations Dashboard"
      />
      <div className="p-6 lg:p-8">
        <OverviewCards />
      </div>
    </>
  );
}
