import { Tags } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export default function PricingPage() {
  return (
    <>
      <PageHeader
        description="Foundation page for newspaper advertisement pricing rules and effective date management."
        title="Pricing Rules"
      />
      <div className="p-6 lg:p-8">
        <EmptyState
          description="Rate cards, rule validation, and Firestore write flows will be implemented in the pricing feature."
          icon={Tags}
          title="Pricing rules shell is ready"
        />
      </div>
    </>
  );
}
