import { NewspaperManagement } from "@/features/newspapers/components/NewspaperManagement";
import { PageHeader } from "@/shared/components/page-header";

export default function NewspapersPage() {
  return (
    <>
      <PageHeader
        description="Manage newspaper profiles, editions, pricing, publication rules, and availability for the booking app."
        title="Newspapers"
      />
      <div className="p-6 lg:p-8">
        <NewspaperManagement />
      </div>
    </>
  );
}
