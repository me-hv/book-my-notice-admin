"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CalendarDays,
  Edit,
  Eye,
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
import { Textarea } from "@/components/ui/textarea";
import {
  createNewspaper,
  deleteNewspaper,
  getNewspapers,
  setNewspaperActive,
  updateNewspaper,
} from "@/features/newspapers/repositories/newspapersRepository";
import type {
  NewspaperDocument,
  NewspaperEdition,
  NewspaperPayload,
  NewspaperPublicationRules,
} from "@/types/newspaper";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

type NewspaperFormState = NewspaperPayload;

type ConfirmAction =
  | { type: "disable"; newspaper: NewspaperDocument }
  | { type: "delete"; newspaper: NewspaperDocument }
  | null;

const emptyPublicationRules: NewspaperPublicationRules = {
  cutoffTime: "",
  availableDays: [],
  holidayBlockDates: [],
};

function createEdition(): NewspaperEdition {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `edition-${Date.now()}`;

  return {
    id,
    name: "",
    city: "",
    state: "",
    publicationDays: [],
    active: true,
    pricing: {
      baseClassifiedRate: 0,
      baseDisplayRate: 0,
      minWordCount: 0,
      extraWordCost: 0,
    },
  };
}

function emptyForm(): NewspaperFormState {
  return {
    name: "",
    language: "",
    category: "",
    logoUrl: "",
    description: "",
    active: true,
    editions: [createEdition()],
    publicationRules: emptyPublicationRules,
  };
}

function formFromNewspaper(newspaper: NewspaperDocument): NewspaperFormState {
  return {
    name: newspaper.name ?? "",
    language: newspaper.language ?? "",
    category: newspaper.category ?? "",
    logoUrl: newspaper.logoUrl ?? "",
    description: newspaper.description ?? "",
    active: newspaper.active ?? true,
    editions: newspaper.editions?.length
      ? newspaper.editions.map((edition, index) => ({
          id: edition.id || `edition-${index + 1}`,
          name: edition.name ?? "",
          city: edition.city ?? "",
          state: edition.state ?? "",
          publicationDays: edition.publicationDays ?? [],
          active: edition.active ?? true,
          pricing: {
            baseClassifiedRate: edition.pricing?.baseClassifiedRate ?? 0,
            baseDisplayRate: edition.pricing?.baseDisplayRate ?? 0,
            minWordCount: edition.pricing?.minWordCount ?? 0,
            extraWordCost: edition.pricing?.extraWordCost ?? 0,
          },
        }))
      : [createEdition()],
    publicationRules: {
      cutoffTime: newspaper.publicationRules?.cutoffTime ?? "",
      availableDays: newspaper.publicationRules?.availableDays ?? [],
      holidayBlockDates: newspaper.publicationRules?.holidayBlockDates ?? [],
    },
  };
}

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value);
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

function formatRate(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function statusBadge(active?: boolean) {
  if (active === false) {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function activeEditionCount(newspaper: NewspaperDocument) {
  return (newspaper.editions ?? []).filter((edition) => edition.active !== false)
    .length;
}

function uniqueSorted(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second));
}

function cityOptions(newspapers: NewspaperDocument[]) {
  return uniqueSorted(
    newspapers.flatMap((newspaper) =>
      (newspaper.editions ?? []).map((edition) => edition.city),
    ),
  );
}

function parseBlockDates(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function daySummary(days?: string[]) {
  if (!days?.length) {
    return "-";
  }

  if (days.length === 7) {
    return "All days";
  }

  return days.join(", ");
}

function ToggleDay({
  checked,
  day,
  onChange,
}: {
  checked: boolean;
  day: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      {day.slice(0, 3)}
    </label>
  );
}

function LogoMark({ newspaper }: { newspaper: NewspaperDocument }) {
  if (newspaper.logoUrl) {
    return (
      <div
        aria-label={`${newspaper.name ?? "Newspaper"} logo`}
        className="size-10 rounded-md border bg-card bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${newspaper.logoUrl}")` }}
      />
    );
  }

  return (
    <div className="flex size-10 items-center justify-center rounded-md border bg-blue-50 text-sm font-semibold text-blue-700">
      {(newspaper.name ?? "N").charAt(0).toUpperCase()}
    </div>
  );
}

function NewspaperFormDialog({
  mode,
  newspaper,
  onOpenChange,
  onSubmit,
  open,
  pending,
}: {
  mode: "create" | "edit";
  newspaper?: NewspaperDocument | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewspaperPayload) => void;
  open: boolean;
  pending: boolean;
}) {
  const [form, setForm] = useState<NewspaperFormState>(() =>
    newspaper ? formFromNewspaper(newspaper) : emptyForm(),
  );

  useEffect(() => {
    if (open) {
      setForm(newspaper ? formFromNewspaper(newspaper) : emptyForm());
    }
  }, [newspaper, open]);

  function updateField<K extends keyof NewspaperFormState>(
    key: K,
    value: NewspaperFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateRules<K extends keyof NewspaperPublicationRules>(
    key: K,
    value: NewspaperPublicationRules[K],
  ) {
    setForm((current) => ({
      ...current,
      publicationRules: {
        ...current.publicationRules,
        [key]: value,
      },
    }));
  }

  function updateEdition(
    editionIndex: number,
    updater: (edition: NewspaperEdition) => NewspaperEdition,
  ) {
    setForm((current) => ({
      ...current,
      editions: current.editions.map((edition, index) =>
        index === editionIndex ? updater(edition) : edition,
      ),
    }));
  }

  function toggleRuleDay(day: string, checked: boolean) {
    const days = form.publicationRules.availableDays ?? [];

    updateRules(
      "availableDays",
      checked ? [...days, day] : days.filter((item) => item !== day),
    );
  }

  function toggleEditionDay(index: number, day: string, checked: boolean) {
    updateEdition(index, (edition) => {
      const days = edition.publicationDays ?? [];

      return {
        ...edition,
        publicationDays: checked
          ? [...days, day]
          : days.filter((item) => item !== day),
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Newspaper" : "Edit Newspaper"}
          </DialogTitle>
          <DialogDescription>
            Configure the newspaper profile, editions, pricing, and publication
            rules used by the booking app.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Newspaper Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newspaper-name">Newspaper Name</Label>
                <Input
                  id="newspaper-name"
                  onChange={(event) => updateField("name", event.target.value)}
                  required
                  value={form.name}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newspaper-language">Language</Label>
                <Input
                  id="newspaper-language"
                  onChange={(event) =>
                    updateField("language", event.target.value)
                  }
                  required
                  value={form.language}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newspaper-category">Category</Label>
                <Input
                  id="newspaper-category"
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  required
                  value={form.category}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newspaper-logo">Logo URL</Label>
                <Input
                  id="newspaper-logo"
                  onChange={(event) =>
                    updateField("logoUrl", event.target.value)
                  }
                  type="url"
                  value={form.logoUrl}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="newspaper-description">Description</Label>
                <Textarea
                  id="newspaper-description"
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  rows={3}
                  value={form.description}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.active}
                  onCheckedChange={(value) =>
                    updateField("active", value === true)
                  }
                />
                Active newspaper
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="size-4 text-blue-600" />
                Publication Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cutoff-time">Cutoff Time</Label>
                  <Input
                    id="cutoff-time"
                    onChange={(event) =>
                      updateRules("cutoffTime", event.target.value)
                    }
                    type="time"
                    value={form.publicationRules.cutoffTime}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holiday-block-dates">
                    Holiday Block Dates
                  </Label>
                  <Input
                    id="holiday-block-dates"
                    onChange={(event) =>
                      updateRules(
                        "holidayBlockDates",
                        parseBlockDates(event.target.value),
                      )
                    }
                    value={(form.publicationRules.holidayBlockDates ?? []).join(
                      ", ",
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Available Days</Label>
                <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {DAYS.map((day) => (
                    <ToggleDay
                      checked={Boolean(
                        form.publicationRules.availableDays?.includes(day),
                      )}
                      day={day}
                      key={day}
                      onChange={(checked) => toggleRuleDay(day, checked)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Editions & Pricing</CardTitle>
              <Button
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    editions: [...current.editions, createEdition()],
                  }))
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
                Add Edition
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.editions.map((edition, index) => (
                <div
                  className="rounded-lg border bg-muted/20 p-4"
                  key={edition.id ?? index}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      Edition {index + 1}
                    </p>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={edition.active !== false}
                          onCheckedChange={(value) =>
                            updateEdition(index, (current) => ({
                              ...current,
                              active: value === true,
                            }))
                          }
                        />
                        Active
                      </label>
                      <Button
                        disabled={form.editions.length === 1}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            editions: current.editions.filter(
                              (_item, itemIndex) => itemIndex !== index,
                            ),
                          }))
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Edition Name</Label>
                      <Input
                        onChange={(event) =>
                          updateEdition(index, (current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        required
                        value={edition.name}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        onChange={(event) =>
                          updateEdition(index, (current) => ({
                            ...current,
                            city: event.target.value,
                          }))
                        }
                        required
                        value={edition.city}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        onChange={(event) =>
                          updateEdition(index, (current) => ({
                            ...current,
                            state: event.target.value,
                          }))
                        }
                        required
                        value={edition.state}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Base Classified Rate</Label>
                      <Input
                        min="0"
                        onChange={(event) =>
                          updateEdition(index, (current) => ({
                            ...current,
                            pricing: {
                              ...current.pricing,
                              baseClassifiedRate: Number(event.target.value),
                            },
                          }))
                        }
                        type="number"
                        value={edition.pricing?.baseClassifiedRate ?? 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Base Display Rate</Label>
                      <Input
                        min="0"
                        onChange={(event) =>
                          updateEdition(index, (current) => ({
                            ...current,
                            pricing: {
                              ...current.pricing,
                              baseDisplayRate: Number(event.target.value),
                            },
                          }))
                        }
                        type="number"
                        value={edition.pricing?.baseDisplayRate ?? 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Word Count</Label>
                      <Input
                        min="0"
                        onChange={(event) =>
                          updateEdition(index, (current) => ({
                            ...current,
                            pricing: {
                              ...current.pricing,
                              minWordCount: Number(event.target.value),
                            },
                          }))
                        }
                        type="number"
                        value={edition.pricing?.minWordCount ?? 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Extra Word Cost</Label>
                      <Input
                        min="0"
                        onChange={(event) =>
                          updateEdition(index, (current) => ({
                            ...current,
                            pricing: {
                              ...current.pricing,
                              extraWordCost: Number(event.target.value),
                            },
                          }))
                        }
                        type="number"
                        value={edition.pricing?.extraWordCost ?? 0}
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>Publication Days</Label>
                    <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
                      {DAYS.map((day) => (
                        <ToggleDay
                          checked={Boolean(
                            edition.publicationDays?.includes(day),
                          )}
                          day={day}
                          key={day}
                          onChange={(checked) =>
                            toggleEditionDay(index, day, checked)
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
              {mode === "create" ? "Create Newspaper" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewspaperDetailsDialog({
  newspaper,
  onOpenChange,
}: {
  newspaper: NewspaperDocument | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(newspaper)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{displayValue(newspaper?.name)}</DialogTitle>
          <DialogDescription>
            Newspaper configuration visible to booking operations and the
            Android app.
          </DialogDescription>
        </DialogHeader>

        {newspaper ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Language: {displayValue(newspaper.language)}</p>
                  <p>Category: {displayValue(newspaper.category)}</p>
                  <p>Status: {newspaper.active === false ? "Disabled" : "Active"}</p>
                  <p>Updated: {formatDateTime(newspaper.updatedAt)}</p>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm">Publication Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Cutoff Time:{" "}
                    {displayValue(newspaper.publicationRules?.cutoffTime)}
                  </p>
                  <p>
                    Available Days:{" "}
                    {daySummary(newspaper.publicationRules?.availableDays)}
                  </p>
                  <p>
                    Holiday Blocks:{" "}
                    {newspaper.publicationRules?.holidayBlockDates?.join(
                      ", ",
                    ) || "-"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Editions</CardTitle>
              </CardHeader>
              <CardContent>
                {newspaper.editions?.length ? (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead>Edition</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Classified</TableHead>
                          <TableHead>Display</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newspaper.editions.map((edition, index) => (
                          <TableRow key={edition.id ?? index}>
                            <TableCell className="font-medium">
                              {displayValue(edition.name)}
                            </TableCell>
                            <TableCell>
                              {[edition.city, edition.state]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </TableCell>
                            <TableCell className="max-w-64">
                              {daySummary(edition.publicationDays)}
                            </TableCell>
                            <TableCell>
                              {formatRate(edition.pricing?.baseClassifiedRate)}
                            </TableCell>
                            <TableCell>
                              {formatRate(edition.pricing?.baseDisplayRate)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={statusBadge(edition.active)}
                                variant="outline"
                              >
                                {edition.active === false
                                  ? "Disabled"
                                  : "Active"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No editions configured.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
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
            {isDelete ? "Delete Newspaper" : "Disable Newspaper"}
          </DialogTitle>
          <DialogDescription>
            {isDelete
              ? "This will permanently delete the newspaper document from Firestore."
              : "This will hide the newspaper from active booking options."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          {displayValue(action?.newspaper.name)}
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

export function NewspaperManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingNewspaper, setEditingNewspaper] =
    useState<NewspaperDocument | null>(null);
  const [viewingNewspaper, setViewingNewspaper] =
    useState<NewspaperDocument | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [message, setMessage] = useState<string | null>(null);

  const newspapersQuery = useQuery({
    queryKey: ["newspapers"],
    queryFn: getNewspapers,
  });

  const refreshNewspapers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["newspapers"] });
  };

  const createMutation = useMutation({
    mutationFn: createNewspaper,
    onSuccess: async () => {
      setCreateOpen(false);
      setMessage("Newspaper created.");
      await refreshNewspapers();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: NewspaperPayload;
    }) => updateNewspaper(id, payload),
    onSuccess: async () => {
      setEditingNewspaper(null);
      setMessage("Newspaper updated.");
      await refreshNewspapers();
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setNewspaperActive(id, active),
    onSuccess: async (_data, variables) => {
      setConfirmAction(null);
      setMessage(variables.active ? "Newspaper enabled." : "Newspaper disabled.");
      await refreshNewspapers();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNewspaper,
    onSuccess: async () => {
      setConfirmAction(null);
      setMessage("Newspaper deleted.");
      await refreshNewspapers();
    },
  });

  const newspapers = useMemo(
    () => newspapersQuery.data ?? [],
    [newspapersQuery.data],
  );
  const languages = useMemo(
    () => uniqueSorted(newspapers.map((newspaper) => newspaper.language)),
    [newspapers],
  );
  const cities = useMemo(() => cityOptions(newspapers), [newspapers]);

  const filteredNewspapers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return newspapers.filter((newspaper) => {
      const editionCities = (newspaper.editions ?? []).map(
        (edition) => edition.city,
      );
      const searchable = [
        newspaper.name,
        newspaper.language,
        newspaper.category,
        ...editionCities,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch || searchable.includes(normalizedSearch);
      const matchesLanguage =
        languageFilter === "ALL" || newspaper.language === languageFilter;
      const matchesCity =
        cityFilter === "ALL" || editionCities.includes(cityFilter);
      const matchesActive =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE" && newspaper.active !== false) ||
        (activeFilter === "DISABLED" && newspaper.active === false);

      return matchesSearch && matchesLanguage && matchesCity && matchesActive;
    });
  }, [activeFilter, cityFilter, languageFilter, newspapers, search]);

  const mutationError =
    createMutation.error ||
    updateMutation.error ||
    activeMutation.error ||
    deleteMutation.error;

  if (newspapersQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Loading newspapers...
      </div>
    );
  }

  if (newspapersQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
        Unable to load newspapers. Please check Firestore permissions or the
        newspapers collection structure.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              onChange={(event) => setSearch(event.target.value)}
              value={search}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 xl:flex xl:items-center">
            <Select onValueChange={setLanguageFilter} value={languageFilter}>
              <SelectTrigger className="h-9 w-full sm:min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All languages</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setCityFilter} value={cityFilter}>
              <SelectTrigger className="h-9 w-full sm:min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setActiveFilter} value={activeFilter}>
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
              Create Newspaper
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            {filteredNewspapers.length} of {newspapers.length} newspapers
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
        {filteredNewspapers.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">
            No newspapers found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Logo</TableHead>
                <TableHead>Newspaper Name</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Active Editions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNewspapers.map((newspaper) => (
                <TableRow key={newspaper.id}>
                  <TableCell>
                    <LogoMark newspaper={newspaper} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {displayValue(newspaper.name)}
                    </div>
                    <div className="max-w-80 truncate text-xs text-muted-foreground">
                      {displayValue(newspaper.description)}
                    </div>
                  </TableCell>
                  <TableCell>{displayValue(newspaper.language)}</TableCell>
                  <TableCell>{displayValue(newspaper.category)}</TableCell>
                  <TableCell>
                    {activeEditionCount(newspaper)} /{" "}
                    {newspaper.editions?.length ?? 0}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={statusBadge(newspaper.active)}
                      variant="outline"
                    >
                      {newspaper.active === false ? "Disabled" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(newspaper.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-sm" variant="outline">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Open actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onSelect={() => setViewingNewspaper(newspaper)}
                        >
                          <Eye className="size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setEditingNewspaper(newspaper)}
                        >
                          <Edit className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={newspaper.active === false}
                          onSelect={() =>
                            setConfirmAction({ type: "disable", newspaper })
                          }
                        >
                          <Ban className="size-4" />
                          Disable
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            setConfirmAction({ type: "delete", newspaper })
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

      <NewspaperFormDialog
        mode="create"
        onOpenChange={setCreateOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
        open={createOpen}
        pending={createMutation.isPending}
      />
      <NewspaperFormDialog
        mode="edit"
        newspaper={editingNewspaper}
        onOpenChange={(open) => {
          if (!open) {
            setEditingNewspaper(null);
          }
        }}
        onSubmit={(payload) => {
          if (editingNewspaper) {
            updateMutation.mutate({ id: editingNewspaper.id, payload });
          }
        }}
        open={Boolean(editingNewspaper)}
        pending={updateMutation.isPending}
      />
      <NewspaperDetailsDialog
        newspaper={viewingNewspaper}
        onOpenChange={(open) => {
          if (!open) {
            setViewingNewspaper(null);
          }
        }}
      />
      <ConfirmationDialog
        action={confirmAction}
        onConfirm={() => {
          if (!confirmAction) {
            return;
          }

          if (confirmAction.type === "delete") {
            deleteMutation.mutate(confirmAction.newspaper.id);
            return;
          }

          activeMutation.mutate({
            id: confirmAction.newspaper.id,
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
