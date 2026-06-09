import { BookingsList } from "@/features/bookings/components/BookingsList";
import { PageHeader } from "@/shared/components/page-header";

export default function BookingsPage() {
  return (
    <>
      <PageHeader
        description="Review customer notice bookings, payment progress, selected newspapers, and operational status."
        title="Bookings"
      />
      <div className="p-6 lg:p-8">
        <BookingsList />
      </div>
    </>
  );
}
