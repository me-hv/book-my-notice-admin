import { Badge } from "@/components/ui/badge";
import { normalizeStatus, statusLabel } from "@/features/bookings/lib/booking-formatters";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/booking";

const statusClasses: Record<string, string> = {
  DRAFT: "border-gray-200 bg-gray-50 text-gray-700",
  SUBMITTED: "border-blue-200 bg-blue-50 text-blue-700",
  UNDER_REVIEW: "border-amber-200 bg-amber-50 text-amber-800",
  DOCUMENTS_REJECTED: "border-red-200 bg-red-50 text-red-700",
  PRICE_CONFIRMED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  PAYMENT_PENDING: "border-orange-200 bg-orange-50 text-orange-700",
  PAID: "border-green-200 bg-green-50 text-green-700",
  SENT_TO_NEWSPAPER: "border-purple-200 bg-purple-50 text-purple-700",
  PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-700",
};

export function BookingStatusBadge({
  status,
  className,
}: {
  status?: BookingStatus | null;
  className?: string;
}) {
  const normalizedStatus = normalizeStatus(status);

  return (
    <Badge
      className={cn(
        "rounded-md border px-2 py-0.5 font-medium shadow-none",
        statusClasses[normalizedStatus] ?? statusClasses.DRAFT,
        className,
      )}
      variant="outline"
    >
      {statusLabel(normalizedStatus)}
    </Badge>
  );
}
