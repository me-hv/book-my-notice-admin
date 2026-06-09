import { Badge } from "@/components/ui/badge";

function normalizeStatus(status?: string | null, active?: boolean) {
  if (active === false) {
    return "DISABLED";
  }

  if (!status) {
    return "ACTIVE";
  }

  return status.trim().replaceAll(" ", "_").replaceAll("-", "_").toUpperCase();
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: string) {
  if (status === "ACTIVE") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "DISABLED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "INACTIVE") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

export function CustomerStatusBadge({
  active,
  status,
}: {
  active?: boolean;
  status?: string;
}) {
  const normalized = normalizeStatus(status, active);

  return (
    <Badge className={statusClass(normalized)} variant="outline">
      {statusLabel(normalized)}
    </Badge>
  );
}
