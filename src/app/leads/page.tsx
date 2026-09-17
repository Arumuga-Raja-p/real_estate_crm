'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Lead, LeadStage, Profile } from '@/lib/types/crm';
import { crmService } from '@/lib/crm-service';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LeadTable } from '@/components/leads/LeadTable';
import { LeadKanban } from '@/components/leads/LeadKanban';
import { LeadModal } from '@/components/leads/LeadModal';
import { BookingModal } from '@/components/bookings/BookingModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [assignedFilter, setAssignedFilter] = useState<string>('All');

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeLeadForBooking, setActiveLeadForBooking] = useState<Lead | null>(null);

  const [, startTransition] = useTransition();

  useEffect(() => {
    loadLeads();
    setProfiles(crmService.getAllProfiles());

    const handleUserChange = () => loadLeads();
    window.addEventListener('crm-user-changed', handleUserChange);
    window.addEventListener('crm-data-reset', handleUserChange);
    return () => {
      window.removeEventListener('crm-user-changed', handleUserChange);
      window.removeEventListener('crm-data-reset', handleUserChange);
    };
  }, [stageFilter, assignedFilter, search]);

  const loadLeads = async () => {
    startTransition(async () => {
      const data = await crmService.getLeads({
        stage: stageFilter as LeadStage | 'All',
        assignedTo: assignedFilter,
        search,
      });
      setLeads(data);
    });
  };

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    await crmService.updateLeadStage(leadId, newStage);
    toast.success(`Lead stage updated to ${newStage}`);
    loadLeads();
  };

  const handleOpenBooking = (lead: Lead) => {
    setActiveLeadForBooking(lead);
    setIsBookingModalOpen(true);
  };

  const leadActions = (
    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
      {/* View Toggle */}
      <div className="bg-muted p-1 rounded-md border border-border flex items-center shadow-2xs shrink-0">
        <button
          type="button"
          onClick={() => setViewMode('kanban')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
            viewMode === 'kanban'
              ? 'bg-background text-foreground shadow-2xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="h-3 w-3" />
          Pipeline
        </button>
        <button
          type="button"
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
            viewMode === 'table'
              ? 'bg-background text-foreground shadow-2xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-3 w-3" />
          Table
        </button>
      </div>

      <Button
        onClick={() => setIsLeadModalOpen(true)}
        size="sm"
        className="h-8 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer flex-1 sm:flex-none whitespace-nowrap"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Lead
      </Button>
    </div>
  );

  return (
    <DashboardShell
      title="Pipeline"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Page Title & Main Actions Row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Lead Management
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Track buyer prospects through the 7-stage pipeline.
            </p>
          </div>
          {leadActions}
        </div>
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 bg-card p-3 rounded-lg border border-border shadow-2xs lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, phone, email..."
              className="pl-9 text-xs bg-muted/30 border-border/70"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap shrink-0">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Filters:</span>
            </div>

            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={(val) => val && setStageFilter(val)}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-[140px] text-xs h-9 bg-muted/30 min-w-0">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Stages</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Site Visit">Site Visit</SelectItem>
                <SelectItem value="Interested">Interested</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Booked">Booked</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            {/* Assigned Agent Filter */}
            <Select value={assignedFilter} onValueChange={(val) => val && setAssignedFilter(val)}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-[150px] text-xs h-9 bg-muted/30 min-w-0">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sales Reps</SelectItem>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.full_name.split(' ')[0]} ({p.role === 'admin' ? 'Admin' : 'Rep'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Content (Kanban or Table) */}
        {viewMode === 'kanban' ? (
          <LeadKanban
            leads={leads}
            onStageChange={handleStageChange}
            onBookLead={handleOpenBooking}
          />
        ) : (
          <LeadTable
            leads={leads}
            onStageChange={handleStageChange}
            onBookLead={handleOpenBooking}
          />
        )}
      </div>

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSuccess={() => loadLeads()}
      />

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setActiveLeadForBooking(null);
        }}
        defaultLeadId={activeLeadForBooking?.id}
        onBookingSuccess={() => loadLeads()}
      />
    </DashboardShell>
  );
}
