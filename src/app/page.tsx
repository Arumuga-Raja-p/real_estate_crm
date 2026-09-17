'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardMetrics, LEAD_STAGES, LeadStage } from '@/lib/types/crm';
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

const STAGE_CONFIG: Record<
  LeadStage,
  { stroke: string; bg: string; text: string; label: string }
> = {
  New: { stroke: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-500', label: 'New' },
  Contacted: { stroke: '#6366f1', bg: 'bg-indigo-500', text: 'text-indigo-500', label: 'Contacted' },
  'Site Visit': { stroke: '#8b5cf6', bg: 'bg-purple-500', text: 'text-purple-500', label: 'Site Visit' },
  Interested: { stroke: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-500', label: 'Interested' },
  Negotiation: { stroke: '#f97316', bg: 'bg-orange-500', text: 'text-orange-500', label: 'Negotiation' },
  Booked: { stroke: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-500', label: 'Booked' },
  Lost: { stroke: '#94a3b8', bg: 'bg-slate-400', text: 'text-slate-400', label: 'Lost' },
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);
  const [selectedPipelineStage, setSelectedPipelineStage] = useState<LeadStage>('New');

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
  const selectedStageCount = metrics.leadsByStage[selectedPipelineStage] || 0;
  const selectedStagePercentage =
    metrics.totalLeads > 0 ? (selectedStageCount / metrics.totalLeads) * 100 : 0;
  const peakStageCount = Math.max(...LEAD_STAGES.map((stage) => metrics.leadsByStage[stage] || 0), 1);

  let accumulatedPercentage = 0;
  const pieSlices = LEAD_STAGES.map((stage) => {
    const count = metrics.leadsByStage[stage] || 0;
    const percentage = metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0;
    const strokeDasharray = `${(percentage / 100) * 238.76} 238.76`;
    const strokeDashoffset = -((accumulatedPercentage / 100) * 238.76);
    accumulatedPercentage += percentage;
    return {
      stage,
      count,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      config: STAGE_CONFIG[stage],
    };
  }).filter((s) => s.count > 0);

  const actionButtons = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsConcurrencyModalOpen(true)}
      className="h-9 rounded-full text-xs border-border bg-card text-foreground hover:bg-muted hidden sm:flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
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
      <div className="space-y-5 sm:space-y-7">
        {/* Page Title & Main Actions Row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {currentUser.full_name.split(' ')[0]}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Here is what is happening across your property inventory and sales pipeline today.
            </p>
          </div>

          {/* Action Buttons: Add Lead & Book Unit */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              onClick={() => setIsLeadModalOpen(true)}
              className="h-10 rounded-full px-4 sm:px-5 text-sm font-medium flex-1 sm:flex-none items-center justify-center gap-2 shadow-2xs hover:bg-muted cursor-pointer transition-colors flex"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
            <Button
              onClick={() => setIsBookingModalOpen(true)}
              className="h-10 rounded-full px-4 sm:px-5 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors flex"
            >
              <Sparkles className="h-4 w-4" />
              Book Unit
            </Button>
          </div>
        </div>

        {/* 4 Signature shadcn Metric Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Revenue */}
          <Card className="shadow-xs border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
          <Card className="shadow-xs border-transparent bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Follow-Ups Today
              </CardTitle>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground text-primary">
                <Clock className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary-foreground">
                {metrics.followUpsToday} Due
              </div>
              <p className="text-xs text-primary-foreground/65 font-medium mt-1">
                Requires sales representative action
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 2-Column Section: Pipeline Distribution + Recent Bookings */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
          {/* Pipeline Stage Funnel (4 Cols) */}
          <Card className="lg:col-span-4 shadow-2xs overflow-hidden">
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
            <CardContent className="pt-2">
              <div className="grid gap-5 grid-cols-1 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="space-y-2.5">
                  {LEAD_STAGES.map((stage, index) => {
                    const count = metrics.leadsByStage[stage] || 0;
                    const totalPercentage =
                      metrics.totalLeads > 0 ? (count / metrics.totalLeads) * 100 : 0;
                    const relativeWidth = Math.max((count / peakStageCount) * 100, count > 0 ? 12 : 4);
                    const isSelected = selectedPipelineStage === stage;

                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setSelectedPipelineStage(stage)}
                        className={`group w-full rounded-2xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-foreground bg-primary text-primary-foreground shadow-sm'
                            : 'border-transparent bg-muted/45 hover:border-foreground/15 hover:bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                isSelected
                                  ? 'bg-primary-foreground text-primary'
                                  : 'bg-background text-foreground ring-1 ring-border'
                              }`}
                            >
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{stage}</p>
                              <p className={`text-[11px] ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                {totalPercentage.toFixed(0)}% of all leads
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold leading-none">{count}</div>
                            <div className={`text-[10px] ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              Leads
                            </div>
                          </div>
                        </div>

                        <div className={`mt-3 h-2.5 rounded-full overflow-hidden ${isSelected ? 'bg-primary-foreground/15' : 'bg-background'}`}>
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isSelected ? 'bg-primary-foreground' : 'bg-foreground'
                            }`}
                            style={{ width: `${relativeWidth}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-3xl border border-border/70 bg-muted/35 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                          Selected Stage
                        </p>
                        <h3 className="mt-1 text-xl font-bold text-foreground">
                          {selectedPipelineStage}
                        </h3>
                      </div>
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {selectedStagePercentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-6">
                      <div className="text-5xl font-bold tracking-tight text-foreground">
                        {selectedStageCount}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        leads currently in this stage
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Total pipeline</span>
                      <span className="font-semibold text-foreground">{metrics.totalLeads} leads</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {LEAD_STAGES.map((stage) => {
                        const count = metrics.leadsByStage[stage] || 0;
                        const height = Math.max((count / peakStageCount) * 72, count > 0 ? 18 : 8);

                        return (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => setSelectedPipelineStage(stage)}
                            title={`${stage}: ${count} leads`}
                            className="flex h-20 items-end justify-center rounded-xl bg-background px-1 transition hover:bg-card"
                          >
                            <span
                              className={`w-full rounded-t-full transition-all ${
                                selectedPipelineStage === stage ? 'bg-primary' : 'bg-muted-foreground/35'
                              }`}
                              style={{ height }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Circle Chart (Top) & Recent Bookings (Bottom) */}
          <div className="lg:col-span-3 flex flex-col gap-4 min-w-0">
            {/* Sales Pipeline Circle / Donut Chart */}
            <Card className="shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Pipeline Distribution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Lead share across active stages.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {metrics.totalLeads} Total
                </Badge>
              </CardHeader>
              <CardContent className="pt-1">
                {metrics.totalLeads === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-4 text-center">
                    No leads in pipeline yet.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Donut Chart */}
                    <div className="relative h-28 w-28 shrink-0 flex items-center justify-center mx-auto sm:mx-0">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r={38}
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="10"
                          className="text-muted/30"
                        />
                        {pieSlices.map((s) => (
                          <circle
                            key={s.stage}
                            cx="50"
                            cy="50"
                            r={38}
                            fill="transparent"
                            stroke={s.config.stroke}
                            strokeWidth={selectedPipelineStage === s.stage ? 13 : 10}
                            strokeDasharray={s.strokeDasharray}
                            strokeDashoffset={s.strokeDashoffset}
                            className="transition-all duration-300 cursor-pointer"
                            onClick={() => setSelectedPipelineStage(s.stage)}
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                          {metrics.totalLeads}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                          Leads
                        </span>
                      </div>
                    </div>

                    {/* Compact Stage Legend */}
                    <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-2 gap-y-1.5">
                      {pieSlices.map((s) => {
                        const isSelected = selectedPipelineStage === s.stage;
                        return (
                          <button
                            key={s.stage}
                            type="button"
                            onClick={() => setSelectedPipelineStage(s.stage)}
                            className={`flex items-center justify-between p-1.5 rounded-lg text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-muted font-semibold ring-1 ring-border'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: s.config.stroke }}
                              />
                              <span className="text-[11px] text-foreground truncate">{s.stage}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground ml-1 shrink-0 font-medium">
                              {s.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Unit Bookings */}
            <Card className="shadow-2xs flex-1 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
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
              <CardContent className="flex-1 pt-1">
                {metrics.recentBookings.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">
                    No confirmed bookings yet.
                  </p>
                ) : (
                  <div className="space-y-3.5">
                    {metrics.recentBookings.slice(0, 3).map((b) => (
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
            <Badge variant="outline" className="text-xs border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
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
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
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
