import { BookingDetail } from "@/features/bookings/components/BookingDetail";
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
        description="Review notice details, documents, pricing, notes, and status actions."
        title={`Booking ${id}`}
      />
      <div className="p-6 lg:p-8">
        <BookingDetail bookingId={id} />
      </div>
    </>
  );
}
