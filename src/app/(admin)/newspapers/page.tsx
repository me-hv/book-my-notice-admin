import { Newspaper } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export default function NewspapersPage() {
  return (
    <>
      <PageHeader
        description="Foundation page for managing newspapers, editions, languages, and publication availability."
        title="Newspapers"
      />
      <div className="p-6 lg:p-8">
        <EmptyState
          description="Newspaper CRUD screens will be backed by the newspapers collection and repository layer."
          icon={Newspaper}
          title="Newspaper management shell is ready"
        />
      </div>
    </>
  );
}
