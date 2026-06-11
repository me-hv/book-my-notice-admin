"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Calculator,
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { getNewspapers } from "@/features/newspapers/repositories/newspapersRepository";
import {
  createPricingRule,
  deletePricingRule,
  getPricingRules,
  setPricingRuleActive,
  updatePricingRule,
} from "@/features/pricing/repositories/pricingRulesRepository";
import { useAuth } from "@/hooks/useAuth";
import type { NewspaperDocument } from "@/types/newspaper";
import {
  noticeTypes,
  type PriceSimulationInput,
  type PriceSimulationResult,
  type PricingRuleDocument,
  type PricingRulePayload,
} from "@/types/pricing-rule";

type PricingRuleFormState = PricingRulePayload;

type ConfirmAction =
  | { type: "disable"; rule: PricingRuleDocument }
  | { type: "delete"; rule: PricingRuleDocument }
  | null;

const emptyComponents = {
  baseCost: 0,
  costPerWord: 0,
  urgentCharge: 0,
  sundayCharge: 0,
  holidayCharge: 0,
  gstPercent: 0,
  agencyCommissionPercent: 0,
};

function emptyForm(): PricingRuleFormState {
  return {
    ruleName: "",
    newspaperId: "",
    newspaperName: "",
    editionId: "",
    editionName: "",
    noticeType: noticeTypes[0],
    language: "",
    active: true,
    components: emptyComponents,
  };
}

function formFromRule(rule: PricingRuleDocument): PricingRuleFormState {
  return {
    ruleName: rule.ruleName ?? "",
    newspaperId: rule.newspaperId ?? "",
    newspaperName: rule.newspaperName ?? "",
    editionId: rule.editionId ?? "",
    editionName: rule.editionName ?? "",
    noticeType: rule.noticeType ?? noticeTypes[0],
    language: rule.language ?? "",
    active: rule.active ?? true,
    components: {
      baseCost: rule.components?.baseCost ?? 0,
      costPerWord: rule.components?.costPerWord ?? 0,
      urgentCharge: rule.components?.urgentCharge ?? 0,
      sundayCharge: rule.components?.sundayCharge ?? 0,
      holidayCharge: rule.components?.holidayCharge ?? 0,
      gstPercent: rule.components?.gstPercent ?? 0,
      agencyCommissionPercent: rule.components?.agencyCommissionPercent ?? 0,
    },
  };
}

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value);
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "INR 0";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value).replace(/^/, "INR ");
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

function statusBadge(active?: boolean) {
  if (active === false) {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function uniqueSorted(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second));
}

function editionsForNewspaper(
  newspapers: NewspaperDocument[],
  newspaperId?: string,
  newspaperName?: string,
) {
  const newspaper = newspapers.find(
    (item) =>
      (newspaperId && item.id === newspaperId) ||
      (newspaperName && item.name === newspaperName),
  );

  return newspaper?.editions ?? [];
}

function ruleRate(rule: PricingRuleDocument) {
  const base = rule.components?.baseCost ?? 0;
  const perWord = rule.components?.costPerWord ?? 0;

  return `${formatCurrency(base)} + ${formatCurrency(perWord)}/word`;
}

function calculatePrice(
  rules: PricingRuleDocument[],
  input: PriceSimulationInput,
): PriceSimulationResult {
  const rule = rules.find((candidate) => {
    const sameNotice = candidate.noticeType === input.noticeType;
    const sameNewspaper =
      (input.newspaperId && candidate.newspaperId === input.newspaperId) ||
      (input.newspaperName && candidate.newspaperName === input.newspaperName);
    const sameEdition =
      (input.editionId && candidate.editionId === input.editionId) ||
      (input.editionName && candidate.editionName === input.editionName);

    return candidate.active !== false && sameNotice && sameNewspaper && sameEdition;
  });

  const components = rule?.components ?? {};
  const base = components.baseCost ?? 0;
  const wordCount = Math.max(input.wordCount || 0, 0);
  const extraWords = Math.max(wordCount, 0);
  const extraWordsCost = extraWords * (components.costPerWord ?? 0);
  const urgentCharge = components.urgentCharge ?? 0;
  const sundayCharge = components.sundayCharge ?? 0;
  const holidayCharge = components.holidayCharge ?? 0;
  const subtotal =
    base + extraWordsCost + urgentCharge + sundayCharge + holidayCharge;
  const agencyCommission =
    subtotal * ((components.agencyCommissionPercent ?? 0) / 100);
  const taxableAmount = subtotal + agencyCommission;
  const taxes = taxableAmount * ((components.gstPercent ?? 0) / 100);
  const total = taxableAmount + taxes;

  return {
    rule,
    base,
    extraWords,
    extraWordsCost,
    urgentCharge,
    sundayCharge,
    holidayCharge,
    agencyCommission,
    taxableAmount,
    taxes,
    total,
  };
}

function actorEmail(adminEmail?: string, userEmail?: string | null) {
  return adminEmail || userEmail || "local-admin";
}

function PricingRuleFormDialog({
  mode,
  newspapers,
  onOpenChange,
  onSubmit,
  open,
  pending,
  rule,
}: {
  mode: "create" | "edit";
  newspapers: NewspaperDocument[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: PricingRulePayload) => void;
  open: boolean;
  pending: boolean;
  rule?: PricingRuleDocument | null;
}) {
  const [form, setForm] = useState<PricingRuleFormState>(() =>
    rule ? formFromRule(rule) : emptyForm(),
  );

  useEffect(() => {
    if (open) {
      setForm(rule ? formFromRule(rule) : emptyForm());
    }
  }, [open, rule]);

  const selectedEditions = editionsForNewspaper(
    newspapers,
    form.newspaperId,
    form.newspaperName,
  );

  function updateField<K extends keyof PricingRuleFormState>(
    key: K,
    value: PricingRuleFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateComponent(
    key: keyof PricingRuleFormState["components"],
    value: number,
  ) {
    setForm((current) => ({
      ...current,
      components: {
        ...current.components,
        [key]: Number.isFinite(value) ? value : 0,
      },
    }));
  }

  function selectNewspaper(value: string) {
    const newspaper = newspapers.find((item) => item.id === value);

    setForm((current) => ({
      ...current,
      newspaperId: newspaper?.id ?? "",
      newspaperName: newspaper?.name ?? "",
      language: newspaper?.language ?? current.language,
      editionId: "",
      editionName: "",
    }));
  }

  function selectEdition(value: string) {
    const edition = selectedEditions.find((item) => item.id === value);

    setForm((current) => ({
      ...current,
      editionId: edition?.id ?? "",
      editionName: edition?.name ?? "",
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Pricing Rule" : "Edit Pricing Rule"}
          </DialogTitle>
          <DialogDescription>
            Configure reusable newspaper pricing rules for automatic
            advertisement calculation.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rule Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  onChange={(event) =>
                    updateField("ruleName", event.target.value)
                  }
                  required
                  value={form.ruleName}
                />
              </div>
              <div className="space-y-2">
                <Label>Notice Type</Label>
                <Select
                  onValueChange={(value) => updateField("noticeType", value)}
                  value={form.noticeType}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {noticeTypes.map((noticeType) => (
                      <SelectItem key={noticeType} value={noticeType}>
                        {noticeType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Newspaper</Label>
                <Select
                  onValueChange={selectNewspaper}
                  value={form.newspaperId || undefined}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select newspaper" />
                  </SelectTrigger>
                  <SelectContent>
                    {newspapers.map((newspaper) => (
                      <SelectItem key={newspaper.id} value={newspaper.id}>
                        {displayValue(newspaper.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Edition</Label>
                <Select
                  disabled={!selectedEditions.length}
                  onValueChange={selectEdition}
                  value={form.editionId || undefined}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select edition" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedEditions.map((edition) => (
                      <SelectItem
                        key={edition.id ?? edition.name}
                        value={edition.id ?? edition.name ?? ""}
                      >
                        {[edition.name, edition.city].filter(Boolean).join(" - ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-language">Language</Label>
                <Input
                  id="rule-language"
                  onChange={(event) =>
                    updateField("language", event.target.value)
                  }
                  required
                  value={form.language}
                />
              </div>
              <label className="flex items-center gap-2 self-end text-sm">
                <Checkbox
                  checked={form.active}
                  onCheckedChange={(value) =>
                    updateField("active", value === true)
                  }
                />
                Active pricing rule
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pricing Components</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <PriceInput
                label="Base Cost"
                onChange={(value) => updateComponent("baseCost", value)}
                value={form.components.baseCost}
              />
              <PriceInput
                label="Cost Per Word"
                onChange={(value) => updateComponent("costPerWord", value)}
                value={form.components.costPerWord}
              />
              <PriceInput
                label="Urgent Charge"
                onChange={(value) => updateComponent("urgentCharge", value)}
                value={form.components.urgentCharge}
              />
              <PriceInput
                label="Sunday Charge"
                onChange={(value) => updateComponent("sundayCharge", value)}
                value={form.components.sundayCharge}
              />
              <PriceInput
                label="Holiday Charge"
                onChange={(value) => updateComponent("holidayCharge", value)}
                value={form.components.holidayCharge}
              />
              <PriceInput
                label="GST %"
                onChange={(value) => updateComponent("gstPercent", value)}
                value={form.components.gstPercent}
              />
              <PriceInput
                label="Agency Commission %"
                onChange={(value) =>
                  updateComponent("agencyCommissionPercent", value)
                }
                value={form.components.agencyCommissionPercent}
              />
            </CardContent>
          </Card>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={pending} type="submit">
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {mode === "create" ? "Create Rule" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PriceInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value?: number;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        min="0"
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value ?? 0}
      />
    </div>
  );
}

function ConfirmationDialog({
  action,
  onConfirm,
  onOpenChange,
  pending,
}: {
  action: ConfirmAction;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
}) {
  const isDelete = action?.type === "delete";

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(action)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isDelete ? "Delete Pricing Rule" : "Disable Pricing Rule"}
          </DialogTitle>
          <DialogDescription>
            {isDelete
              ? "This permanently removes the pricing rule from Firestore."
              : "This prevents the pricing rule from being used in calculations."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          {displayValue(action?.rule.ruleName)}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={pending}
            onClick={onConfirm}
            type="button"
            variant={isDelete ? "destructive" : "default"}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {isDelete ? "Delete" : "Disable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PricingSimulator({
  newspapers,
  rules,
}: {
  newspapers: NewspaperDocument[];
  rules: PricingRuleDocument[];
}) {
  const [input, setInput] = useState<PriceSimulationInput>({
    noticeType: noticeTypes[0],
    wordCount: 50,
  });

  const selectedEditions = editionsForNewspaper(
    newspapers,
    input.newspaperId,
    input.newspaperName,
  );
  const result = useMemo(
    () => calculatePrice(rules, input),
    [input, rules],
  );

  function selectNewspaper(value: string) {
    const newspaper = newspapers.find((item) => item.id === value);

    setInput((current) => ({
      ...current,
      newspaperId: newspaper?.id,
      newspaperName: newspaper?.name,
      editionId: undefined,
      editionName: undefined,
    }));
  }

  function selectEdition(value: string) {
    const edition = selectedEditions.find((item) => item.id === value);

    setInput((current) => ({
      ...current,
      editionId: edition?.id,
      editionName: edition?.name,
    }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="size-4 text-blue-600" />
          Price Calculator Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Notice Type</Label>
            <Select
              onValueChange={(value) =>
                setInput((current) => ({ ...current, noticeType: value }))
              }
              value={input.noticeType}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noticeTypes.map((noticeType) => (
                  <SelectItem key={noticeType} value={noticeType}>
                    {noticeType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Word Count</Label>
            <Input
              min="0"
              onChange={(event) =>
                setInput((current) => ({
                  ...current,
                  wordCount: Number(event.target.value),
                }))
              }
              type="number"
              value={input.wordCount}
            />
          </div>
          <div className="space-y-2">
            <Label>Newspaper</Label>
            <Select onValueChange={selectNewspaper} value={input.newspaperId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select newspaper" />
              </SelectTrigger>
              <SelectContent>
                {newspapers.map((newspaper) => (
                  <SelectItem key={newspaper.id} value={newspaper.id}>
                    {displayValue(newspaper.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Edition</Label>
            <Select
              disabled={!selectedEditions.length}
              onValueChange={selectEdition}
              value={input.editionId}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select edition" />
              </SelectTrigger>
              <SelectContent>
                {selectedEditions.map((edition) => (
                  <SelectItem
                    key={edition.id ?? edition.name}
                    value={edition.id ?? edition.name ?? ""}
                  >
                    {[edition.name, edition.city].filter(Boolean).join(" - ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <SimulatorMetric label="Base" value={formatCurrency(result.base)} />
          <SimulatorMetric
            label="Extra Words"
            value={`${result.extraWords} words / ${formatCurrency(
              result.extraWordsCost,
            )}`}
          />
          <SimulatorMetric label="Taxes" value={formatCurrency(result.taxes)} />
          <SimulatorMetric label="Total" value={formatCurrency(result.total)} />
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          {result.rule
            ? `Matched rule: ${result.rule.ruleName}`
            : "No active pricing rule matches this simulator input."}
        </div>
      </CardContent>
    </Card>
  );
}

function SimulatorMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function PricingRulesManagement() {
  const queryClient = useQueryClient();
  const { admin, user } = useAuth();
  const [search, setSearch] = useState("");
  const [newspaperFilter, setNewspaperFilter] = useState("ALL");
  const [noticeTypeFilter, setNoticeTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRuleDocument | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [message, setMessage] = useState<string | null>(null);

  const actor = actorEmail(admin?.email, user?.email);

  const pricingRulesQuery = useQuery({
    queryKey: ["pricingRules"],
    queryFn: getPricingRules,
  });
  const newspapersQuery = useQuery({
    queryKey: ["newspapers"],
    queryFn: getNewspapers,
  });

  const refreshPricingRules = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pricingRules"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: PricingRulePayload) => createPricingRule(payload, actor),
    onSuccess: async () => {
      setCreateOpen(false);
      setMessage("Pricing rule created.");
      await refreshPricingRules();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PricingRulePayload;
    }) => updatePricingRule(id, payload, actor),
    onSuccess: async () => {
      setEditingRule(null);
      setMessage("Pricing rule updated.");
      await refreshPricingRules();
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setPricingRuleActive(id, active, actor),
    onSuccess: async (_data, variables) => {
      setConfirmAction(null);
      setMessage(variables.active ? "Pricing rule enabled." : "Pricing rule disabled.");
      await refreshPricingRules();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePricingRule(id, actor),
    onSuccess: async () => {
      setConfirmAction(null);
      setMessage("Pricing rule deleted.");
      await refreshPricingRules();
    },
  });

  const pricingRules = useMemo(
    () => pricingRulesQuery.data ?? [],
    [pricingRulesQuery.data],
  );
  const newspapers = useMemo(
    () => newspapersQuery.data ?? [],
    [newspapersQuery.data],
  );

  const newspaperOptions = useMemo(
    () => uniqueSorted(pricingRules.map((rule) => rule.newspaperName)),
    [pricingRules],
  );

  const filteredRules = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return pricingRules.filter((rule) => {
      const searchable = [
        rule.ruleName,
        rule.newspaperName,
        rule.editionName,
        rule.noticeType,
        rule.language,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesNewspaper =
        newspaperFilter === "ALL" || rule.newspaperName === newspaperFilter;
      const matchesNoticeType =
        noticeTypeFilter === "ALL" || rule.noticeType === noticeTypeFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && rule.active !== false) ||
        (statusFilter === "DISABLED" && rule.active === false);

      return (
        matchesSearch &&
        matchesNewspaper &&
        matchesNoticeType &&
        matchesStatus
      );
    });
  }, [newspaperFilter, noticeTypeFilter, pricingRules, search, statusFilter]);

  const mutationError =
    createMutation.error ||
    updateMutation.error ||
    activeMutation.error ||
    deleteMutation.error;

  if (pricingRulesQuery.isLoading || newspapersQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Loading pricing rules...
      </div>
    );
  }

  if (pricingRulesQuery.isError || newspapersQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
        Unable to load pricing rules. Please check Firestore permissions or the
        pricingRules collection structure.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PricingSimulator newspapers={newspapers} rules={pricingRules} />

      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search rule, newspaper, edition, language"
              value={search}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 xl:flex xl:items-center">
            <Select onValueChange={setNewspaperFilter} value={newspaperFilter}>
              <SelectTrigger className="h-9 w-full sm:min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All newspapers</SelectItem>
                {newspaperOptions.map((newspaper) => (
                  <SelectItem key={newspaper} value={newspaper}>
                    {newspaper}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setNoticeTypeFilter} value={noticeTypeFilter}>
              <SelectTrigger className="h-9 w-full sm:min-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All notice types</SelectItem>
                {noticeTypes.map((noticeType) => (
                  <SelectItem key={noticeType} value={noticeType}>
                    {noticeType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger className="h-9 w-full sm:min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DISABLED">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create Rule
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredRules.length} of {pricingRules.length} pricing rules
          </span>
          {message ? <span className="text-emerald-700">{message}</span> : null}
          {mutationError ? (
            <span className="text-destructive">
              Unable to save changes. Please check Firestore permissions.
            </span>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {filteredRules.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">
            No pricing rules found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Rule Name</TableHead>
                <TableHead>Newspaper</TableHead>
                <TableHead>Edition</TableHead>
                <TableHead>Notice Type</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Audit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {displayValue(rule.ruleName)}
                  </TableCell>
                  <TableCell>{displayValue(rule.newspaperName)}</TableCell>
                  <TableCell>{displayValue(rule.editionName)}</TableCell>
                  <TableCell>{displayValue(rule.noticeType)}</TableCell>
                  <TableCell>{displayValue(rule.language)}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {ruleRate(rule)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadge(rule.active)} variant="outline">
                      {rule.active === false ? "Disabled" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      <p>{displayValue(rule.updatedBy)}</p>
                      <p>{formatDateTime(rule.updatedAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-sm" variant="outline">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onSelect={() => setEditingRule(rule)}>
                          <Edit className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={rule.active === false}
                          onSelect={() =>
                            setConfirmAction({ type: "disable", rule })
                          }
                        >
                          <Ban className="size-4" />
                          Disable
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            setConfirmAction({ type: "delete", rule })
                          }
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <PricingRuleFormDialog
        mode="create"
        newspapers={newspapers}
        onOpenChange={setCreateOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
        open={createOpen}
        pending={createMutation.isPending}
      />
      <PricingRuleFormDialog
        mode="edit"
        newspapers={newspapers}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRule(null);
          }
        }}
        onSubmit={(payload) => {
          if (editingRule) {
            updateMutation.mutate({ id: editingRule.id, payload });
          }
        }}
        open={Boolean(editingRule)}
        pending={updateMutation.isPending}
        rule={editingRule}
      />
      <ConfirmationDialog
        action={confirmAction}
        onConfirm={() => {
          if (!confirmAction) {
            return;
          }

          if (confirmAction.type === "delete") {
            deleteMutation.mutate(confirmAction.rule.id);
            return;
          }

          activeMutation.mutate({
            id: confirmAction.rule.id,
            active: false,
          });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
        pending={activeMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}
