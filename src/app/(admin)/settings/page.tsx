import { SettingsManagement } from "@/features/settings/components/SettingsManagement";
import { PageHeader } from "@/shared/components/page-header";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        description="Manage staff access, notifications, business rules, legal documents, and audit visibility."
        title="Settings"
      />
      <div className="p-6 lg:p-8">
        <SettingsManagement />
      </div>
    </>
  );
}
