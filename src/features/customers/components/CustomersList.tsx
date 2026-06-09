"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, Search, UserCheck, UsersRound, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerStatusBadge } from "@/features/customers/components/CustomerStatusBadge";
import {
  getCustomers,
  getCustomerStats,
} from "@/features/customers/repositories/customersRepository";
import type { CustomerWithBookings } from "@/types/customer";

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  return String(value);
}

function formatDate(value?: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function customerName(customer: CustomerWithBookings) {
  return customer.name || customer.email || customer.mobile || customer.id;
}

function bookingDisplayId(booking?: CustomerWithBookings["lastBooking"]) {
  if (!booking) {
    return "-";
  }

  return booking.bookingId || booking.id;
}

function matchesSearch(customer: CustomerWithBookings, search: string) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const bookingIds = customer.bookings
    .map((booking) => booking.bookingId || booking.id)
    .join(" ");
  const searchable = [
    customer.name,
    customer.email,
    customer.mobile,
    customer.phone,
    bookingIds,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes(normalizedSearch);
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function CustomersList() {
  const [search, setSearch] = useState("");

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
  });

  const customers = useMemo(
    () => customersQuery.data ?? [],
    [customersQuery.data],
  );
  const stats = useMemo(() => getCustomerStats(customers), [customers]);
  const filteredCustomers = useMemo(
    () => customers.filter((customer) => matchesSearch(customer, search)),
    [customers, search],
  );

  if (customersQuery.isLoading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-sm text-muted-foreground">
        Loading customers...
      </div>
    );
  }

  if (customersQuery.isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-sm text-destructive">
        Unable to load customers. Please check Firestore permissions or the
        users collection structure.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={UsersRound}
          label="Total Customers"
          value={stats.totalCustomers}
        />
        <StatCard
          icon={UserCheck}
          label="Active Customers"
          value={stats.activeCustomers}
        />
        <StatCard
          icon={UserRoundCheck}
          label="Repeat Customers"
          value={stats.repeatCustomers}
        />
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, mobile, booking ID"
              value={search}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">
            No customers found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Total Bookings</TableHead>
                <TableHead>Last Booking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {displayValue(customerName(customer))}
                  </TableCell>
                  <TableCell>{displayValue(customer.email)}</TableCell>
                  <TableCell>
                    {displayValue(customer.mobile ?? customer.phone)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.totalBookings}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-mono text-xs">
                        {bookingDisplayId(customer.lastBooking)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(customer.lastBooking?.createdAt)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CustomerStatusBadge
                      active={customer.active}
                      status={customer.status}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/customers/${customer.id}`}>
                        <Eye className="size-4" />
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
