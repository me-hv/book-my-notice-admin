"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  ReceiptText,
  Save,
  Send,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import {
  bookingDisplayId,
  displayValue,
  formatCurrency,
  formatDateTime,
  newspaperName,
  statusLabel,
} from "@/features/bookings/lib/booking-formatters";
import {
  addAdminNote,
  addUserVisibleTimelineEntry,
  confirmBookingPricing,
  getAdminNotes,
  getBookingById,
  getTimeline,
  markBookingPaidManually,
  markBookingPublished,
  markSentToNewspaper,
  moveBookingToPaymentPending,
  normalizeBookingSchema,
  updateBookingDocumentVerification,
  updateBookingStatus,
  updateNoticeMatter,
} from "@/features/bookings/repositories/bookingsRepository";
import { useAuth } from "@/hooks/useAuth";
import type {
  AdminNote,
  BookingDocument,
  BookingDocumentLink,
  BookingPricing,
  BookingStatus,
  TimelineEntry,
} from "@/types/booking";

type PricingForm = Required<
  Pick<
    BookingPricing,
    | "basePrice"
    | "extraWordCharges"
    | "urgencyCharge"
    | "agencyCommission"
    | "gst"
    | "discount"
    | "total"
  >
>;

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{displayValue(value)}</p>
    </div>
  );
}

function numericValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function pricingFromBooking(booking?: BookingDocument | null): PricingForm {
  return {
    basePrice: numericValue(booking?.pricing?.basePrice),
    extraWordCharges: numericValue(booking?.pricing?.extraWordCharges),
    urgencyCharge: numericValue(booking?.pricing?.urgencyCharge),
    agencyCommission: numericValue(booking?.pricing?.agencyCommission),
    gst: numericValue(booking?.pricing?.gst),
    discount: numericValue(booking?.pricing?.discount),
    total: numericValue(
      booking?.pricing?.total ??
        booking?.pricing?.finalPrice ??
        booking?.finalPrice,
    ),
  };
}

function calculatedTotal(pricing: PricingForm) {
  return (
    pricing.basePrice +
    pricing.extraWordCharges +
    pricing.urgencyCharge +
    pricing.agencyCommission +
    pricing.gst -
    pricing.discount
  );
}

function legacyNotes(notes: BookingDocument["adminNotes"]): AdminNote[] {
  if (!notes) {
    return [];
  }

  if (typeof notes === "string") {
    return notes ? [{ note: notes, createdBy: "Legacy field" }] : [];
  }

  return notes;
}

function PriceInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <Input
        min="0"
        onChange={(event) => onChange(Number(event.target.value || 0))}
        type="number"
        value={String(value)}
      />
    </label>
  );
}

function DocumentReviewRow({
  document,
  index,
  loading,
  onApprove,
  onReject,
}: {
  document: BookingDocumentLink;
  index: number;
  loading: boolean;
  onApprove: (index: number) => void;
  onReject: (index: number, reason: string) => void;
}) {
  const [reason, setReason] = useState(document.rejectionReason ?? "");

  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <p className="truncate text-sm font-medium">
              {displayValue(document.name)}
            </p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {displayValue(document.type)} · Uploaded{" "}
            {formatDateTime(document.uploadedAt)}
          </p>
          <div className="mt-2">
            {document.verified ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                Verified
              </Badge>
            ) : document.rejectionReason ? (
              <Badge className="border-red-200 bg-red-50 text-red-700">
                Rejected
              </Badge>
            ) : (
              <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                Pending Review
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {document.url ? (
            <Button asChild size="sm" variant="outline">
              <a href={document.url} rel="noreferrer" target="_blank">
                <ExternalLink className="size-4" />
                Preview
              </a>
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
          <Button
            disabled={loading}
            onClick={() => onApprove(index)}
            size="sm"
            variant="outline"
          >
            <ShieldCheck className="size-4" />
            Approve
          </Button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input
          onChange={(event) => setReason(event.target.value)}
          placeholder="Rejection reason"
          value={reason}
        />
        <Button
          disabled={loading || !reason.trim()}
          onClick={() => onReject(index, reason.trim())}
          size="sm"
          variant="destructive"
        >
          <XCircle className="size-4" />
          Reject
        </Button>
      </div>
      {document.rejectionReason ? (
        <p className="mt-2 text-xs text-red-700">
          Reason: {document.rejectionReason}
        </p>
      ) : null}
    </div>
  );
}

function TimelineList({ timeline }: { timeline: TimelineEntry[] }) {
  if (!timeline.length) {
    return (
      <p className="text-sm text-muted-foreground">No timeline updates yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {timeline.map((entry) => (
        <div className="rounded-md border p-3" key={entry.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <BookingStatusBadge status={entry.status} />
            <div className="flex items-center gap-2">
              {entry.visibleToUser ? (
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                  User visible
                </Badge>
              ) : (
                <Badge variant="outline">Internal</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDateTime(entry.createdAt)}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm">{displayValue(entry.message)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Created by {displayValue(entry.createdBy ?? entry.updatedBy)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function BookingDetail({ bookingId }: { bookingId: string }) {
  const queryClient = useQueryClient();
  const { admin, user } = useAuth();
  const adminEmail = admin?.email ?? user?.email ?? "local-admin";
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [note, setNote] = useState("");
  const [userTimelineMessage, setUserTimelineMessage] = useState("");
  const [editingMatter, setEditingMatter] = useState(false);
  const [noticeMatter, setNoticeMatter] = useState("");
  const [pricing, setPricing] = useState<PricingForm>(() =>
    pricingFromBooking(null),
  );
  const [proofUrl, setProofUrl] = useState("");
  const [publicationDate, setPublicationDate] = useState("");

  const bookingQuery = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId),
  });

  const notesQuery = useQuery({
    queryKey: ["booking", bookingId, "adminNotes"],
    queryFn: () => getAdminNotes(bookingId),
  });

  const timelineQuery = useQuery({
    queryKey: ["booking", bookingId, "timeline"],
    queryFn: () => getTimeline(bookingId),
  });

  const booking = bookingQuery.data;
  const documents = booking?.documents ?? [];
  const timeline = timelineQuery.data ?? [];
  const allNotes = useMemo(
    () => [...(notesQuery.data ?? []), ...legacyNotes(booking?.adminNotes)],
    [booking?.adminNotes, notesQuery.data],
  );
  const total = calculatedTotal(pricing);
  const paymentStatus = booking?.payment?.status ?? "NOT_REQUIRED_YET";
  const publicationStatus = booking?.publication?.status ?? "NOT_SENT";

  useEffect(() => {
    if (!booking) {
      return;
    }

    setNoticeMatter(booking.noticeMatter ?? "");
    setPricing(pricingFromBooking(booking));
    setProofUrl(booking.publication?.proofUrl ?? "");
    setPublicationDate(
      booking.publication?.publicationDate
        ? booking.publication.publicationDate.toISOString().slice(0, 10)
        : "",
    );
  }, [booking]);

  useEffect(() => {
    if (!booking) {
      return;
    }

    normalizeBookingSchema(bookingId).catch(() => {
      setErrorMessage("Unable to normalize legacy booking schema.");
    });
  }, [booking, bookingId]);

  async function refreshAll() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] }),
      queryClient.invalidateQueries({
        queryKey: ["booking", bookingId, "timeline"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["booking", bookingId, "adminNotes"],
      }),
      queryClient.invalidateQueries({ queryKey: ["bookings"] }),
      queryClient.invalidateQueries({ queryKey: ["customers"] }),
    ]);
  }

  function mutationSuccess(message: string) {
    setSuccessMessage(message);
    setErrorMessage("");
  }

  function mutationError(message: string) {
    setErrorMessage(message);
  }

  const matterMutation = useMutation({
    mutationFn: () => updateNoticeMatter(bookingId, noticeMatter),
    onSuccess: async () => {
      setEditingMatter(false);
      mutationSuccess("Notice matter updated successfully.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to update notice matter."),
  });

  const documentMutation = useMutation({
    mutationFn: (input: {
      documentIndex: number;
      verified: boolean;
      rejectionReason?: string;
    }) =>
      updateBookingDocumentVerification({
        id: bookingId,
        updatedBy: adminEmail,
        ...input,
      }),
    onSuccess: async () => {
      mutationSuccess("Document review saved.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to update document review."),
  });

  const pricingMutation = useMutation({
    mutationFn: () =>
      confirmBookingPricing(
        bookingId,
        {
          ...pricing,
          total,
          status: "CONFIRMED",
        },
        adminEmail,
      ),
    onSuccess: async () => {
      mutationSuccess("Final price confirmed.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to confirm pricing."),
  });

  const paymentPendingMutation = useMutation({
    mutationFn: () => moveBookingToPaymentPending(bookingId, total, adminEmail),
    onSuccess: async () => {
      mutationSuccess("Booking moved to payment pending.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to move booking to payment pending."),
  });

  const markPaidMutation = useMutation({
    mutationFn: () => markBookingPaidManually(bookingId, adminEmail),
    onSuccess: async () => {
      mutationSuccess("Payment marked as paid.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to mark payment paid."),
  });

  const sentMutation = useMutation({
    mutationFn: () => markSentToNewspaper(bookingId, adminEmail),
    onSuccess: async () => {
      mutationSuccess("Booking sent to newspaper.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to send booking to newspaper."),
  });

  const publishedMutation = useMutation({
    mutationFn: () =>
      markBookingPublished({
        id: bookingId,
        proofUrl,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        updatedBy: adminEmail,
      }),
    onSuccess: async () => {
      mutationSuccess("Booking marked published.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to mark booking published."),
  });

  const statusMutation = useMutation({
    mutationFn: (input: { status: BookingStatus; message: string; visibleToUser: boolean }) =>
      updateBookingStatus(bookingId, input.status, {
        message: input.message,
        updatedBy: adminEmail,
        visibleToUser: input.visibleToUser,
      }),
    onSuccess: async () => {
      mutationSuccess("Status updated.");
      await refreshAll();
    },
    onError: (error) => {
      console.error("Status update failed", error);
      const errorDetail =
        error instanceof Error ? error.message : "Check developer console.";

      mutationError(`Unable to update status. ${errorDetail}`);
    },
  });

  const noteMutation = useMutation({
    mutationFn: (adminNote: string) => addAdminNote(bookingId, adminNote, adminEmail),
    onSuccess: async () => {
      setNote("");
      mutationSuccess("Admin note added successfully.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to add admin note."),
  });

  const userTimelineMutation = useMutation({
    mutationFn: (message: string) =>
      addUserVisibleTimelineEntry(bookingId, message, adminEmail),
    onSuccess: async () => {
      setUserTimelineMessage("");
      mutationSuccess("User-visible timeline update added.");
      await refreshAll();
    },
    onError: () => mutationError("Unable to add timeline update."),
  });

  function onAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (note.trim()) {
      noteMutation.mutate(note.trim());
    }
  }

  function onAddUserTimeline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (userTimelineMessage.trim()) {
      userTimelineMutation.mutate(userTimelineMessage.trim());
    }
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Loading booking...
      </div>
    );
  }

  if (bookingQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
        Unable to load booking. Please check Firestore permissions or collection
        structure.
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">
        Booking not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {successMessage ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="size-4" />
          {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <Card className="rounded-lg shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Booking Overview</CardTitle>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {bookingDisplayId(booking)}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Document ID" value={booking.id} />
              <Field label="Status" value={statusLabel(booking.status)} />
              <Field label="Payment" value={statusLabel(paymentStatus)} />
              <Field
                label="Pricing"
                value={statusLabel(booking.pricing?.status)}
              />
              <Field
                label="Publication"
                value={statusLabel(publicationStatus)}
              />
              <Field label="Created" value={formatDateTime(booking.createdAt)} />
              <Field label="Updated" value={formatDateTime(booking.updatedAt)} />
              <Field label="Publication City" value={booking.publicationCity} />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Customer" value={booking.customerName} />
              <Field label="Email" value={booking.customerEmail} />
              <Field label="Phone" value={booking.customerPhone} />
              <Field label="User ID" value={booking.userId} />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Notice Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Notice Type" value={booking.noticeType} />
              <Field label="Language" value={booking.language} />
              <Field label="City" value={booking.city} />
              <Field label="State" value={booking.state} />
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Notice Matter</CardTitle>
              <Button
                onClick={() => setEditingMatter((value) => !value)}
                size="sm"
                variant="outline"
              >
                <Pencil className="size-4" />
                {editingMatter ? "Cancel" : "Edit Matter"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {editingMatter ? (
                <>
                  <Textarea
                    className="min-h-52"
                    onChange={(event) => setNoticeMatter(event.target.value)}
                    value={noticeMatter}
                  />
                  <Button
                    disabled={matterMutation.isPending}
                    onClick={() => matterMutation.mutate()}
                  >
                    {matterMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Save Matter
                  </Button>
                </>
              ) : (
                <div className="min-h-40 whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-6">
                  {displayValue(booking.noticeMatter)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.length ? (
                documents.map((document, index) => (
                  <DocumentReviewRow
                    document={document}
                    index={index}
                    key={`${document.name}-${document.url ?? index}`}
                    loading={documentMutation.isPending}
                    onApprove={(documentIndex) =>
                      documentMutation.mutate({
                        documentIndex,
                        verified: true,
                      })
                    }
                    onReject={(documentIndex, rejectionReason) =>
                      documentMutation.mutate({
                        documentIndex,
                        rejectionReason,
                        verified: false,
                      })
                    }
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Selected Newspapers</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.selectedNewspapers?.length ? (
                <div className="flex flex-wrap gap-2">
                  {booking.selectedNewspapers.map((newspaper, index) => (
                    <Badge
                      className="rounded-md border-slate-200 bg-slate-50 text-slate-700"
                      key={`${newspaperName(newspaper)}-${index}`}
                      variant="outline"
                    >
                      {newspaperName(newspaper)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading timeline...
                </p>
              ) : (
                <TimelineList timeline={timeline} />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="rounded-lg border-primary/20 shadow-none">
            <CardHeader>
              <CardTitle>Pricing Confirmation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <PriceInput
                  label="Base Price"
                  onChange={(value) =>
                    setPricing((current) => ({ ...current, basePrice: value }))
                  }
                  value={pricing.basePrice}
                />
                <PriceInput
                  label="Extra Word Charges"
                  onChange={(value) =>
                    setPricing((current) => ({
                      ...current,
                      extraWordCharges: value,
                    }))
                  }
                  value={pricing.extraWordCharges}
                />
                <PriceInput
                  label="Urgency Charge"
                  onChange={(value) =>
                    setPricing((current) => ({
                      ...current,
                      urgencyCharge: value,
                    }))
                  }
                  value={pricing.urgencyCharge}
                />
                <PriceInput
                  label="Agency Commission"
                  onChange={(value) =>
                    setPricing((current) => ({
                      ...current,
                      agencyCommission: value,
                    }))
                  }
                  value={pricing.agencyCommission}
                />
                <PriceInput
                  label="GST"
                  onChange={(value) =>
                    setPricing((current) => ({ ...current, gst: value }))
                  }
                  value={pricing.gst}
                />
                <PriceInput
                  label="Discount"
                  onChange={(value) =>
                    setPricing((current) => ({ ...current, discount: value }))
                  }
                  value={pricing.discount}
                />
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Final Total
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={pricingMutation.isPending}
                onClick={() => pricingMutation.mutate()}
              >
                {pricingMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Confirm Final Price
              </Button>
              <Button
                className="w-full"
                disabled={paymentPendingMutation.isPending}
                onClick={() => paymentPendingMutation.mutate()}
                variant="outline"
              >
                Move To Payment Pending
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Status" value={statusLabel(paymentStatus)} />
              <Field
                label="Amount"
                value={formatCurrency(booking.payment?.amount ?? total)}
              />
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                <ReceiptText className="mb-2 size-4" />
                {booking.payment?.receiptUrl ? (
                  <a
                    className="text-primary underline"
                    href={booking.payment.receiptUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open receipt
                  </a>
                ) : (
                  "Receipt will be generated soon."
                )}
              </div>
              <Button
                className="w-full"
                disabled={markPaidMutation.isPending}
                onClick={() => markPaidMutation.mutate()}
                variant="outline"
              >
                Mark Paid Manually
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Publication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Status" value={statusLabel(publicationStatus)} />
              <Button
                className="w-full"
                disabled={sentMutation.isPending}
                onClick={() => sentMutation.mutate()}
                variant="outline"
              >
                Send To Newspaper
              </Button>
              <div className="space-y-2">
                <Label htmlFor="proof-url">Publication Proof URL</Label>
                <Input
                  id="proof-url"
                  onChange={(event) => setProofUrl(event.target.value)}
                  placeholder="https://..."
                  value={proofUrl}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publication-date">Publication Date</Label>
                <Input
                  id="publication-date"
                  onChange={(event) => setPublicationDate(event.target.value)}
                  type="date"
                  value={publicationDate}
                />
              </div>
              <Button
                className="w-full"
                disabled={publishedMutation.isPending}
                onClick={() => publishedMutation.mutate()}
              >
                {publishedMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Save Proof & Mark Published
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Additional Status Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    status: "UNDER_REVIEW",
                    message: "Your booking is under review.",
                    visibleToUser: true,
                  })
                }
                size="sm"
                variant="outline"
              >
                {statusMutation.isPending &&
                statusMutation.variables?.status === "UNDER_REVIEW" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Mark Under Review
              </Button>
              <Button
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    status: "REJECTED",
                    message: "Your booking has been rejected.",
                    visibleToUser: true,
                  })
                }
                size="sm"
                variant="outline"
              >
                {statusMutation.isPending &&
                statusMutation.variables?.status === "REJECTED" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Reject Booking
              </Button>
              <Button
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    status: "CANCELLED",
                    message: "Your booking has been cancelled.",
                    visibleToUser: true,
                  })
                }
                size="sm"
                variant="outline"
              >
                {statusMutation.isPending &&
                statusMutation.variables?.status === "CANCELLED" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Cancel Booking
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>User-Visible Update</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={onAddUserTimeline}>
                <Textarea
                  onChange={(event) => setUserTimelineMessage(event.target.value)}
                  placeholder="Message visible in Android timeline"
                  value={userTimelineMessage}
                />
                <Button
                  className="w-full"
                  disabled={
                    userTimelineMutation.isPending ||
                    !userTimelineMessage.trim()
                  }
                  type="submit"
                  variant="outline"
                >
                  Add User Timeline
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg shadow-none">
            <CardHeader>
              <CardTitle>Internal Admin Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-2" onSubmit={onAddNote}>
                <Textarea
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add an internal note"
                  value={note}
                />
                <Button
                  className="w-full"
                  disabled={noteMutation.isPending || !note.trim()}
                  type="submit"
                >
                  {noteMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Add Note
                </Button>
              </form>

              {notesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading notes...</p>
              ) : allNotes.length ? (
                <div className="space-y-2">
                  {allNotes.map((adminNote, index) => (
                    <div
                      className="rounded-md border p-3"
                      key={`${adminNote.id ?? adminNote.note}-${index}`}
                    >
                      <p className="text-sm">{adminNote.note}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {displayValue(adminNote.createdBy)} ·{" "}
                        {adminNote.createdAt instanceof Date
                          ? formatDateTime(adminNote.createdAt)
                          : displayValue(adminNote.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
