import { BookOpenText } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export default function BookingsPage() {
  return (
    <>
      <PageHeader
        description="Foundation page for listing and reviewing customer advertisement bookings at scale."
        title="Bookings"
      />
      <div className="p-6 lg:p-8">
        <EmptyState
          description="The bookings table, filters, pagination, and Firestore query strategy will be implemented in the bookings feature module."
          icon={BookOpenText}
          title="Bookings workspace is ready"
        />
      </div>
    </>
  );
}
