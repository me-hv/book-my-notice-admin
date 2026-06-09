"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  Lock,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge } from "@/features/bookings/components/BookingStatusBadge";
import {
  bookingDisplayId,
  displayValue,
  formatDateTime,
  newspapersSummary,
  statusLabel,
} from "@/features/bookings/lib/booking-formatters";
import { CustomerStatusBadge } from "@/features/customers/components/CustomerStatusBadge";
import { getCustomerById } from "@/features/customers/repositories/customersRepository";
import type { BookingDocument } from "@/types/booking";
import type { CustomerWithBookings } from "@/types/customer";

function customerName(customer: CustomerWithBookings) {
  return customer.name || customer.email || customer.mobile || customer.id;
}

function publishedDate(booking: BookingDocument) {
  return booking.updatedAt ?? booking.createdAt ?? null;
}

function TimelineItem({ booking }: { booking: BookingDocument }) {
  return (
    <div className="relative border-l border-border pb-5 pl-5 last:pb-0">
      <span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-blue-600" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">{bookingDisplayId(booking)}</p>
          <p className="text-sm text-muted-foreground">
            {displayValue(booking.noticeType)} ·{" "}
            {newspapersSummary(booking.selectedNewspapers)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(booking.createdAt)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
    </div>
  );
}

export function CustomerDetail({ customerId }: { customerId: string }) {
  const customerQuery = useQuery({
    queryKey: ["customers", customerId],
    queryFn: () => getCustomerById(customerId),
  });

  if (customerQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-sm text-muted-foreground">
        Loading customer...
      </div>
    );
  }

  if (customerQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
        Unable to load customer. Please check Firestore permissions or the users
        collection structure.
      </div>
    );
  }

  const customer = customerQuery.data;

  if (!customer) {
    return (
      <div className="rounded-lg border bg-white p-8 text-sm text-muted-foreground">
        Customer not found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <UserRound className="size-4 text-blue-600" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">{customerName(customer)}</h2>
              <div className="mt-2">
                <CustomerStatusBadge
                  active={customer.active}
                  status={customer.status}
                />
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                {displayValue(customer.email)}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                {displayValue(customer.mobile ?? customer.phone)}
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                Joined {formatDateTime(customer.createdAt)}
              </div>
              <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-muted-foreground">
                <Lock className="mt-0.5 size-4 shrink-0" />
                Login credentials are managed by Firebase Authentication and are
                not editable from this admin dashboard.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{customer.totalBookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Documents Uploaded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {customer.documentsUploaded.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Published Notices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {customer.publishedNotices.length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Booking History Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No booking history found.
            </p>
          ) : (
            <div className="space-y-0">
              {customer.bookings.map((booking) => (
                <TimelineItem booking={booking} key={booking.id} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings found.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Notice Type</TableHead>
                    <TableHead>Newspapers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">
                        {bookingDisplayId(booking)}
                      </TableCell>
                      <TableCell>{displayValue(booking.noticeType)}</TableCell>
                      <TableCell className="max-w-72 truncate">
                        {newspapersSummary(booking.selectedNewspapers)}
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell>{formatDateTime(booking.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/bookings/${booking.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-blue-600" />
              Documents Uploaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.documentsUploaded.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No uploaded documents found.
              </p>
            ) : (
              <div className="space-y-2">
                {customer.documentsUploaded.map((document, index) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3"
                    key={`${document.url ?? document.name}-${index}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {displayValue(document.name)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {displayValue(document.type)}
                      </p>
                    </div>
                    {document.url ? (
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={document.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="size-4" />
                          Preview
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Published Notices</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.publishedNotices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No published notices found.
              </p>
            ) : (
              <div className="space-y-2">
                {customer.publishedNotices.map((booking) => (
                  <div
                    className="rounded-lg border bg-white p-3"
                    key={booking.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs">
                          {bookingDisplayId(booking)}
                        </p>
                        <p className="text-sm font-medium">
                          {displayValue(booking.noticeType)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Published {formatDateTime(publishedDate(booking))}
                        </p>
                      </div>
                      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        {statusLabel(booking.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
