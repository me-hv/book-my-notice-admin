import { UsersRound } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        description="Foundation page for customer records synced from the Android booking application."
        title="Customers"
      />
      <div className="p-6 lg:p-8">
        <EmptyState
          description="Customer lookup, profile summaries, and booking history will be added after the users repository is connected."
          icon={UsersRound}
          title="Customer workspace is ready"
        />
      </div>
    </>
  );
}
