'use client';

import React, { useState, useEffect } from 'react';
import { Booking } from '@/lib/types/crm';
import { crmService } from '@/lib/crm-service';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookingModal } from '@/components/bookings/BookingModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  Plus,
  Building,
  User,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const list = await crmService.getBookings();
    setBookings(list);
  };

  const totalClosedValue = bookings.reduce(
    (sum, b) => sum + (b.unit?.price || b.booking_amount),
    0
  );
  const totalTokensCollected = bookings.reduce((sum, b) => sum + b.booking_amount, 0);

  const headerActions = (
    <Button
      onClick={() => setIsBookingModalOpen(true)}
      size="sm"
      className="h-8 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
    >
      <Plus className="h-3.5 w-3.5" />
      New Booking
    </Button>
  );

  return (
    <DashboardShell
      title="Bookings & Reservations"
      subtitle="Complete transaction audit log of units secured with token advances."
      actionButton={headerActions}
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Closed Deals
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {bookings.length} Units
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Zero double-booking conflicts guaranteed
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Inventory Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${totalClosedValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Aggregate property value reserved
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Secured Token Advances
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                ${totalTokensCollected.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total non-refundable booking tokens
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
          {bookings.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/60 mx-auto" />
              <p className="text-sm text-foreground font-semibold">
                No units booked yet.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Use the &quot;New Booking&quot; button or pick an available unit from the inventory tab.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-foreground text-xs">Booking ID</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Customer / Lead</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Property Unit</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Price</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Token Paid</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Closing Agent</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {booking.id.replace('booking-', '#BK-')}
                      </span>
                      <span className="text-[10px] block">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </span>
                    </TableCell>

                    <TableCell>
                      {booking.lead ? (
                        <Link
                          href={`/leads/${booking.lead.id}`}
                          className="font-semibold text-foreground hover:text-primary text-xs block"
                        >
                          {booking.lead.first_name} {booking.lead.last_name}
                          <span className="text-[11px] text-muted-foreground font-normal block">
                            {booking.lead.phone}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Prospect</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div>
                          <span className="font-bold text-foreground">
                            {booking.unit?.unit_number || 'Unit'}
                          </span>{' '}
                          <span className="text-muted-foreground">
                            ({booking.unit?.type})
                          </span>
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[150px]">
                            {booking.unit?.building?.name || 'Main Tower'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-semibold text-foreground">
                      ${booking.unit?.price.toLocaleString() || '—'}
                    </TableCell>

                    <TableCell className="text-xs font-bold text-emerald-700">
                      ${booking.booking_amount.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {booking.booked_by_profile?.full_name?.split(' ')[0] || 'Sales Rep'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold uppercase"
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingSuccess={() => loadBookings()}
      />
    </DashboardShell>
  );
}
