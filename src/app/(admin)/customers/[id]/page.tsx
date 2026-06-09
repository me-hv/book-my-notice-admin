import { CustomerDetail } from "@/features/customers/components/CustomerDetail";
import { PageHeader } from "@/shared/components/page-header";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        description="Review profile details, booking history, uploaded documents, and published notices."
        title={`Customer ${id}`}
      />
      <div className="p-6 lg:p-8">
        <CustomerDetail customerId={id} />
      </div>
    </>
  );
}
