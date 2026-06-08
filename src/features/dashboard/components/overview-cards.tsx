import {
  Banknote,
  BookOpenCheck,
  CircleDollarSign,
  FileCheck2,
  Newspaper,
} from "lucide-react";

import { StatCard } from "@/shared/components/stat-card";

const overviewCards = [
  {
    title: "Total Bookings",
    value: "-",
    description: "Connect Firestore metrics repository",
    icon: BookOpenCheck,
  },
  {
    title: "Pending Verification",
    value: "-",
    description: "Bookings awaiting document review",
    icon: FileCheck2,
  },
  {
    title: "Payment Pending",
    value: "-",
    description: "Payment status integration pending",
    icon: CircleDollarSign,
  },
  {
    title: "Published Today",
    value: "-",
    description: "Publication status source pending",
    icon: Newspaper,
  },
  {
    title: "Monthly Revenue",
    value: "-",
    description: "Revenue aggregation not implemented",
    icon: Banknote,
  },
];

export function OverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {overviewCards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
