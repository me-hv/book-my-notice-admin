import { CustomersList } from "@/features/customers/components/CustomersList";
import { PageHeader } from "@/shared/components/page-header";

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        description="Search customers, review booking history, and support published notice follow-up."
        title="Customers"
      />
      <div className="p-6 lg:p-8">
        <CustomersList />
      </div>
    </>
  );
}
