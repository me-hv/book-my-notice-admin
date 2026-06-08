import { BookMarked } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        description="Foundation page for reviewing a single advertisement booking and related customer documents."
        title={`Booking ${id}`}
      />
      <div className="p-6 lg:p-8">
        <EmptyState
          description="Booking detail sections will connect to the typed bookings repository and document storage URLs in a later feature slice."
          icon={BookMarked}
          title="Booking detail shell is ready"
        />
      </div>
    </>
  );
}
