import { Settings } from "lucide-react";

import { EmptyState } from "@/shared/components/empty-state";
import { PageHeader } from "@/shared/components/page-header";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Foundation page for admin preferences, staff configuration, and integration settings."
        title="Settings"
      />
      <div className="p-6 lg:p-8">
        <EmptyState
          description="Settings forms will be added after admin permission boundaries and audit requirements are finalized."
          icon={Settings}
          title="Settings shell is ready"
        />
      </div>
    </>
  );
}
