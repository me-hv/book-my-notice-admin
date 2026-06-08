import { PageHeader } from "@/shared/components/page-header";
import { OverviewCards } from "@/features/dashboard/components/overview-cards";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        badge="Overview"
        description="Operational placeholders for the core booking console. Metrics will be connected after repositories and indexes are finalized."
        title="Dashboard"
      />
      <div className="p-6 lg:p-8">
        <OverviewCards />
      </div>
    </>
  );
}
