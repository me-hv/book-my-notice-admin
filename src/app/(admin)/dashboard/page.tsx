import { PageHeader } from "@/shared/components/page-header";
import { OverviewCards } from "@/features/dashboard/components/overview-cards";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        badge="Overview"
        description="Live booking metrics from Firestore for the operations team."
        title="Dashboard"
      />
      <div className="p-6 lg:p-8">
        <OverviewCards />
      </div>
    </>
  );
}
