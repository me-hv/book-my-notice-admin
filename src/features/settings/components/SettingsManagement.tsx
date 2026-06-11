"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  History,
  Loader2,
  Lock,
  Plus,
  Save,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultBookingSettings,
  defaultBusinessSettings,
  defaultLegalSettings,
  defaultNotificationSettings,
  defaultRolePermissions,
  permissionLabels,
  addStaffMember,
  getSettingsBundle,
  saveBookingSettings,
  saveBusinessSettings,
  saveLegalSettings,
  saveNotificationSettings,
  saveRolePermissions,
  updateStaffMember,
} from "@/features/settings/repositories/settingsRepository";
import { useAuth } from "@/hooks/useAuth";
import {
  adminRoles,
  type AdminStaffMember,
  type AdminStaffRole,
  type AuditLogEntry,
  type BookingSettings,
  type BusinessSettings,
  type LegalSettings,
  type NotificationSettings,
  type PermissionKey,
  type RolePermissionsSettings,
  type SettingsBundle,
} from "@/types/settings";

const permissions = Object.keys(permissionLabels) as PermissionKey[];

const fallbackSettings: SettingsBundle = {
  staff: [],
  notifications: defaultNotificationSettings,
  business: defaultBusinessSettings,
  booking: defaultBookingSettings,
  legal: defaultLegalSettings,
  roles: defaultRolePermissions,
  auditLogs: [],
};

function actorEmail(adminEmail?: string, userEmail?: string | null) {
  return adminEmail || userEmail || "local-admin";
}

function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDateTime(value?: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function statusBadge(active: boolean) {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-50 text-slate-700";
}

function roleBadge(role: string) {
  if (role === "SUPER_ADMIN") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (role === "MANAGER") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }

  if (role === "OPERATOR") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function SettingToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border bg-card p-4">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

function StaffDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    staff: Omit<AdminStaffMember, "createdAt" | "updatedAt">,
  ) => void;
  pending: boolean;
  staff?: AdminStaffMember | null;
}) {
  const [uid, setUid] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AdminStaffRole>("SUPPORT");
  const [active, setActive] = useState(true);
  const isEditing = Boolean(staff);

  useEffect(() => {
    if (!open) {
      return;
    }

    setUid(staff?.uid ?? "");
    setEmail(staff?.email ?? "");
    setDisplayName(staff?.displayName ?? "");
    setRole(
      adminRoles.includes(staff?.role as AdminStaffRole)
        ? (staff?.role as AdminStaffRole)
        : "SUPPORT",
    );
    setActive(staff?.active ?? true);
  }, [open, staff]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      uid,
      email,
      displayName,
      role,
      active,
      updatedBy: staff?.updatedBy,
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Admin" : "Add Admin"}</DialogTitle>
          <DialogDescription>
            Add staff to the admin allowlist. Firebase Authentication still owns
            login credentials and passwords.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="staff-uid">Firebase UID</Label>
            <Input
              disabled={isEditing}
              id="staff-uid"
              onChange={(event) => setUid(event.target.value)}
              required
              value={uid}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              disabled={isEditing}
              id="staff-email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-name">Display Name</Label>
            <Input
              id="staff-name"
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              onValueChange={(value) => setRole(value as AdminStaffRole)}
              value={role}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {adminRoles.map((adminRole) => (
                  <SelectItem key={adminRole} value={adminRole}>
                    {roleLabel(adminRole)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={active}
              onCheckedChange={(value) => setActive(value === true)}
            />
            Active admin account
          </label>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={pending} type="submit">
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEditing ? "Save Admin" : "Add Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StaffManagement({
  actor,
  onMessage,
  staff,
}: {
  actor: string;
  onMessage: (message: string) => void;
  staff: AdminStaffMember[];
}) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<AdminStaffMember | null>(
    null,
  );

  const addMutation = useMutation({
    mutationFn: (payload: Omit<AdminStaffMember, "createdAt" | "updatedAt">) =>
      addStaffMember(payload, actor),
    onSuccess: async () => {
      setDialogOpen(false);
      onMessage("Admin added.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Omit<AdminStaffMember, "createdAt" | "updatedAt">) =>
      updateStaffMember(
        payload.uid,
        {
          role: payload.role,
          active: payload.active,
          displayName: payload.displayName,
        },
        actor,
      ),
    onSuccess: async () => {
      setEditingStaff(null);
      onMessage("Admin updated.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium">Staff Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage admin access records. Passwords and login credentials are not
            editable here.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add Admin
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Admin</TableHead>
              <TableHead>UID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell
                  className="py-8 text-center text-muted-foreground"
                  colSpan={6}
                >
                  No admin staff records found.
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member.uid}>
                  <TableCell>
                    <div className="font-medium">
                      {member.displayName || member.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-48 truncate font-mono text-xs">
                    {member.uid}
                  </TableCell>
                  <TableCell>
                    <Badge className={roleBadge(member.role)} variant="outline">
                      {roleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={statusBadge(member.active)}
                      variant="outline"
                    >
                      {member.active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(member.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      onClick={() => setEditingStaff(member)}
                      size="sm"
                      variant="outline"
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StaffDialog
        onOpenChange={setDialogOpen}
        onSubmit={(payload) => addMutation.mutate(payload)}
        open={dialogOpen}
        pending={addMutation.isPending}
      />
      <StaffDialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingStaff(null);
          }
        }}
        onSubmit={(payload) => updateMutation.mutate(payload)}
        open={Boolean(editingStaff)}
        pending={updateMutation.isPending}
        staff={editingStaff}
      />
    </div>
  );
}

function RolePermissions({
  actor,
  onMessage,
  roles,
}: {
  actor: string;
  onMessage: (message: string) => void;
  roles: RolePermissionsSettings;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<RolePermissionsSettings>(roles);

  useEffect(() => {
    setForm(roles);
  }, [roles]);

  const mutation = useMutation({
    mutationFn: () => saveRolePermissions(form, actor),
    onSuccess: async () => {
      onMessage("Role permissions updated.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  function togglePermission(
    role: string,
    permission: PermissionKey,
    checked: boolean,
  ) {
    setForm((current) => {
      const rolePermissions = current[role] ?? [];

      return {
        ...current,
        [role]: checked
          ? [...new Set([...rolePermissions, permission])]
          : rolePermissions.filter((item) => item !== permission),
      };
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ShieldCheck className="size-4 text-blue-600" />
          Roles & Permissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          {adminRoles.map((role) => (
            <div className="rounded-lg border bg-card p-4" key={role}>
              <h4 className="font-medium">{roleLabel(role)}</h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <label
                    className="flex items-center gap-2 text-sm"
                    key={`${role}-${permission}`}
                  >
                    <Checkbox
                      checked={Boolean(form[role]?.includes(permission))}
                      onCheckedChange={(value) =>
                        togglePermission(role, permission, value === true)
                      }
                    />
                    {permissionLabels[permission]}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Permissions
        </Button>
      </CardContent>
    </Card>
  );
}

function NotificationSettingsForm({
  actor,
  onMessage,
  settings,
}: {
  actor: string;
  onMessage: (message: string) => void;
  settings: NotificationSettings;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => saveNotificationSettings(form, actor),
    onSuccess: async () => {
      onMessage("Notification settings saved.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bell className="size-4 text-blue-600" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <SettingToggle
            checked={form.email}
            description="Send operational updates by email."
            label="Email"
            onChange={(email) => setForm((current) => ({ ...current, email }))}
          />
          <SettingToggle
            checked={form.sms}
            description="Enable SMS alerts for critical booking events."
            label="SMS"
            onChange={(sms) => setForm((current) => ({ ...current, sms }))}
          />
          <SettingToggle
            checked={form.push}
            description="Enable push notifications for app events."
            label="Push"
            onChange={(push) => setForm((current) => ({ ...current, push }))}
          />
        </div>
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Notifications
        </Button>
      </CardContent>
    </Card>
  );
}

function BusinessSettingsForm({
  actor,
  onMessage,
  settings,
}: {
  actor: string;
  onMessage: (message: string) => void;
  settings: BusinessSettings;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => saveBusinessSettings(form, actor),
    onSuccess: async () => {
      onMessage("Business settings saved.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <BriefcaseBusiness className="size-4 text-blue-600" />
          Business Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Company Name</Label>
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                companyName: event.target.value,
              }))
            }
            value={form.companyName}
          />
        </div>
        <div className="space-y-2">
          <Label>Support Number</Label>
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                supportPhone: event.target.value,
              }))
            }
            value={form.supportPhone}
          />
        </div>
        <div className="space-y-2">
          <Label>Support Email</Label>
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                supportEmail: event.target.value,
              }))
            }
            type="email"
            value={form.supportEmail}
          />
        </div>
        <div className="md:col-span-3">
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Business Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingSettingsForm({
  actor,
  onMessage,
  settings,
}: {
  actor: string;
  onMessage: (message: string) => void;
  settings: BookingSettings;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => saveBookingSettings(form, actor),
    onSuccess: async () => {
      onMessage("Booking settings saved.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="size-4 text-blue-600" />
          Booking Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <label className="flex items-center gap-2 self-end text-sm">
          <Checkbox
            checked={form.autoApproval}
            onCheckedChange={(value) =>
              setForm((current) => ({
                ...current,
                autoApproval: value === true,
              }))
            }
          />
          Auto Approval
        </label>
        <div className="space-y-2">
          <Label>Default Review Time (hours)</Label>
          <Input
            min="0"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                defaultReviewTimeHours: Number(event.target.value),
              }))
            }
            type="number"
            value={form.defaultReviewTimeHours}
          />
        </div>
        <div className="space-y-2">
          <Label>Draft Expiry (days)</Label>
          <Input
            min="0"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                draftExpiryDays: Number(event.target.value),
              }))
            }
            type="number"
            value={form.draftExpiryDays}
          />
        </div>
        <div className="md:col-span-3">
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save Booking Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LegalSettingsForm({
  actor,
  onMessage,
  settings,
}: {
  actor: string;
  onMessage: (message: string) => void;
  settings: LegalSettings;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => saveLegalSettings(form, actor),
    onSuccess: async () => {
      onMessage("Legal documents saved.");
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="size-4 text-blue-600" />
          Legal Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Privacy Policy</Label>
          <Textarea
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                privacyPolicy: event.target.value,
              }))
            }
            rows={8}
            value={form.privacyPolicy}
          />
        </div>
        <div className="space-y-2">
          <Label>Terms</Label>
          <Textarea
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                terms: event.target.value,
              }))
            }
            rows={8}
            value={form.terms}
          />
        </div>
        <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save Legal Documents
        </Button>
      </CardContent>
    </Card>
  );
}

function AuditLogs({ logs }: { logs: AuditLogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="size-4 text-blue-600" />
          Audit Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Event</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="py-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.eventType}</Badge>
                    </TableCell>
                    <TableCell>{log.actorEmail ?? "-"}</TableCell>
                    <TableCell>
                      {[log.targetType, log.targetId].filter(Boolean).join(": ") ||
                        "-"}
                    </TableCell>
                    <TableCell>{log.message ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsManagement() {
  const { admin, user } = useAuth();
  const actor = actorEmail(admin?.email, user?.email);
  const [message, setMessage] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: getSettingsBundle,
  });

  const settings = settingsQuery.data ?? fallbackSettings;
  const tabs = useMemo(
    () => [
      { icon: UserCog, label: "Staff", value: "staff" },
      { icon: Bell, label: "Notifications", value: "notifications" },
      { icon: BriefcaseBusiness, label: "Business", value: "business" },
      { icon: ClipboardList, label: "Booking", value: "booking" },
      { icon: FileText, label: "Legal", value: "legal" },
      { icon: History, label: "Audit Logs", value: "audit" },
    ],
    [],
  );

  if (settingsQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settingsQuery.isError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Some settings could not be read from Firestore. Default settings are
          shown so the control center remains usable.
        </div>
      ) : null}

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-medium">Administrative Control Center</h2>
            <p className="text-sm text-muted-foreground">
              Configure staff access, operating rules, legal text, and audit
              visibility.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Credentials stay in Firebase Auth
          </div>
        </div>
        {message ? (
          <p className="mt-3 text-sm text-emerald-700">{message}</p>
        ) : null}
      </div>

      <Tabs defaultValue="staff">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              className="h-8 flex-none px-3 text-xs"
              key={tab.value}
              value={tab.value}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent className="mt-4 space-y-4" value="staff">
          <StaffManagement
            actor={actor}
            onMessage={setMessage}
            staff={settings?.staff ?? []}
          />
          <RolePermissions
            actor={actor}
            onMessage={setMessage}
            roles={settings?.roles ?? defaultRolePermissions}
          />
        </TabsContent>

        <TabsContent className="mt-4" value="notifications">
          <NotificationSettingsForm
            actor={actor}
            onMessage={setMessage}
            settings={settings?.notifications ?? defaultNotificationSettings}
          />
        </TabsContent>

        <TabsContent className="mt-4" value="business">
          <BusinessSettingsForm
            actor={actor}
            onMessage={setMessage}
            settings={settings?.business ?? defaultBusinessSettings}
          />
        </TabsContent>

        <TabsContent className="mt-4" value="booking">
          <BookingSettingsForm
            actor={actor}
            onMessage={setMessage}
            settings={settings?.booking ?? defaultBookingSettings}
          />
        </TabsContent>

        <TabsContent className="mt-4" value="legal">
          <LegalSettingsForm
            actor={actor}
            onMessage={setMessage}
            settings={settings?.legal ?? defaultLegalSettings}
          />
        </TabsContent>

        <TabsContent className="mt-4" value="audit">
          <AuditLogs logs={settings?.auditLogs ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
