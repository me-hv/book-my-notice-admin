import { PricingRulesManagement } from "@/features/pricing/components/PricingRulesManagement";
import { PageHeader } from "@/shared/components/page-header";

export default function PricingPage() {
  return (
    <>
      <PageHeader
        description="Configure newspaper advertisement pricing rules, rate components, and calculation simulation."
        title="Pricing Rules"
      />
      <div className="p-6 lg:p-8">
        <PricingRulesManagement />
      </div>
    </>
  );
}
