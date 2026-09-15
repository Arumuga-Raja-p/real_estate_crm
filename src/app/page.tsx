'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardMetrics, LEAD_STAGES } from '@/lib/types/crm';
import { crmService } from '@/lib/crm-service';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BookingModal } from '@/components/bookings/BookingModal';
import { LeadModal } from '@/components/leads/LeadModal';
import { ConcurrencyTestModal } from '@/components/properties/ConcurrencyTestModal';
import { StageBadge } from '@/components/leads/StageBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Plus,
  ArrowUpRight,
  Zap,
  Sparkles,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    const data = await crmService.getDashboardMetrics();
    setMetrics(data);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadDashboard);

    const handleUserChange = () => loadDashboard();
    window.addEventListener('crm-user-changed', handleUserChange);
    window.addEventListener('crm-data-reset', handleUserChange);
    return () => {
      window.removeEventListener('crm-user-changed', handleUserChange);
      window.removeEventListener('crm-data-reset', handleUserChange);
    };
  }, [loadDashboard]);

  if (!metrics) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">Loading dashboard analytics...</p>
        </div>
      </DashboardShell>
    );
  }

  const currentUser = crmService.getCurrentUser();
  const conversionRate =
    metrics.totalLeads > 0
      ? ((metrics.bookedLeads / metrics.totalLeads) * 100).toFixed(1)
      : '0';

  const actionButtons = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsConcurrencyModalOpen(true)}
      className="h-9 rounded-full text-xs border-border bg-card text-foreground hover:bg-muted flex items-center gap-1.5 cursor-pointer"
    >
      <Zap className="h-3.5 w-3.5 text-foreground" />
      Test Concurrency
    </Button>
  );

  return (
    <DashboardShell
      title="Dashboard Overview"
      actionButton={actionButtons}
    >
      <div className="space-y-7">
        {/* Page Title & Main Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {currentUser.full_name.split(' ')[0]}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Here is what is happening across your property inventory and sales pipeline today.
            </p>
          </div>

          {/* Action Buttons: Add Lead & Book Unit */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsLeadModalOpen(true)}
              className="h-10 rounded-full px-5 text-sm font-medium flex items-center gap-2 shadow-2xs hover:bg-muted cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
            <Button
              onClick={() => setIsBookingModalOpen(true)}
              className="h-10 rounded-full px-5 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Book Unit
            </Button>
          </div>
        </div>

        {/* 4 Signature shadcn Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <Card className="shadow-xs border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/65">
                Total Closed Revenue
              </CardTitle>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <DollarSign className="h-4 w-4 text-foreground" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ${(metrics.totalRevenue / 1000).toFixed(0)}k
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-emerald-600 font-semibold inline-flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5" /> {conversionRate}%
                </span>{' '}
                overall pipeline conversion
              </p>
            </CardContent>
          </Card>

          {/* Active Leads */}
          <Card className="shadow-xs border-transparent bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Inquiries
              </CardTitle>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground text-primary">
                <Users className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-foreground">
                {metrics.activeLeads} Leads
              </div>
              <p className="text-xs text-primary-foreground/65 mt-1">
                {metrics.totalLeads} total records in pipeline
              </p>
            </CardContent>
          </Card>

          {/* Available Units */}
          <Card className="shadow-xs border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Available Inventory
              </CardTitle>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-4 w-4 text-foreground" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metrics.availableUnits} Units
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.bookedUnits} units under confirmed booking
              </p>
            </CardContent>
          </Card>

          {/* Follow-ups Today */}
          <Card className="shadow-xs border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Follow-Ups Today
              </CardTitle>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Clock className="h-4 w-4 text-foreground" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {metrics.followUpsToday} Due
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Requires sales representative action
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 2-Column Section: Pipeline Distribution + Recent Bookings */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Pipeline Stage Funnel (4 Cols) */}
          <Card className="col-span-4 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Sales Pipeline Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution of leads across the 7 progression stages.
                </CardDescription>
              </div>
              <Link
                href="/leads"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                Kanban Board <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-2">
              {LEAD_STAGES.map((stage) => {
                const count = metrics.leadsByStage[stage] || 0;
                const percentage =
                  metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0;

                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <StageBadge stage={stage} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{count}</span>
                        <span className="text-muted-foreground text-[11px]">
                          ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          stage === 'Booked'
                            ? 'bg-emerald-500'
                            : stage === 'Lost'
                            ? 'bg-neutral-300'
                            : stage === 'Interested' || stage === 'Negotiation'
                            ? 'bg-amber-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${Math.max(percentage, count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Bookings (3 Cols) - Iconic shadcn "Recent Sales" style */}
          <Card className="col-span-3 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Recent Unit Bookings
                </CardTitle>
                <CardDescription className="text-xs">
                  Latest confirmed property agreements.
                </CardDescription>
              </div>
              <Link
                href="/bookings"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {metrics.recentBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  No confirmed bookings yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {metrics.recentBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarFallback className="text-xs font-bold bg-muted text-foreground">
                            {b.lead?.first_name?.[0] || 'U'}
                            {b.lead?.last_name?.[0] || 'N'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {b.lead?.first_name} {b.lead?.last_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            Unit {b.unit?.unit_number} ({b.unit?.type})
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-foreground">
                          +${b.unit?.price.toLocaleString() || '—'}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium">
                          Token: ${b.booking_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Follow-ups Table / Action Center */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                Scheduled Client Follow-Ups
              </CardTitle>
              <CardDescription className="text-xs">
                Appointments, follow-up calls, and site visits scheduled by sales employees.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-800">
              {metrics.upcomingFollowUps.length} Pending Actions
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {metrics.upcomingFollowUps.length === 0 ? (
              <p className="p-6 text-xs text-muted-foreground italic text-center">
                No upcoming follow-ups scheduled.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {metrics.upcomingFollowUps.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.lead ? (
                          <Link
                            href={`/leads/${item.lead.id}`}
                            className="font-bold text-xs text-foreground hover:text-primary transition"
                          >
                            {item.lead.first_name} {item.lead.last_name}
                          </Link>
                        ) : (
                          <span className="font-bold text-xs text-foreground">Prospect</span>
                        )}
                        {item.lead?.stage && <StageBadge stage={item.lead.stage} />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.note}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Due: {item.follow_up_date ? new Date(item.follow_up_date).toLocaleDateString() : 'Today'}
                      </span>
                      {item.lead && (
                        <Link href={`/leads/${item.lead.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs flex items-center gap-1">
                            Details <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={() => loadDashboard()}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingSuccess={() => loadDashboard()}
      />

      <ConcurrencyTestModal
        isOpen={isConcurrencyModalOpen}
        onClose={() => setIsConcurrencyModalOpen(false)}
        onFinished={() => loadDashboard()}
      />
    </DashboardShell>
  );
}
