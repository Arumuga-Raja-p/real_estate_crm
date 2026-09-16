'use client';

import React, { useState, useEffect, use } from 'react';
import { Lead, LeadNote, LeadStage, LEAD_STAGES, Profile } from '@/lib/types/crm';
import { crmService } from '@/lib/crm-service';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StageBadge } from '@/components/leads/StageBadge';
import { BookingModal } from '@/components/bookings/BookingModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Send,
  Building,
  UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;

  const [lead, setLead] = useState<(Lead & { notes: LeadNote[] }) | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadLeadData();
    setProfiles(crmService.getAllProfiles());
  }, [leadId]);

  const loadLeadData = async () => {
    const data = await crmService.getLeadById(leadId);
    setLead(data);
  };

  const handleStageChange = async (newStage: LeadStage) => {
    if (!lead) return;
    await crmService.updateLeadStage(lead.id, newStage);
    toast.success(`Pipeline stage updated to ${newStage}`);
    loadLeadData();
  };

  const handleAssignChange = async (repId: string) => {
    if (!lead) return;
    await crmService.assignLead(lead.id, repId);
    toast.success('Assigned sales representative updated.');
    loadLeadData();
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !lead) return;

    setSavingNote(true);
    try {
      await crmService.addLeadNote(
        lead.id,
        noteText,
        followUpDate ? new Date(followUpDate).toISOString() : undefined
      );
      toast.success('Note & follow-up saved to timeline.');
      setNoteText('');
      setFollowUpDate('');
      loadLeadData();
    } catch {
      toast.error('Failed to save note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (!lead) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">Loading lead record...</p>
        </div>
      </DashboardShell>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Link href="/leads">
        <Button variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Leads
        </Button>
      </Link>
      {lead.stage !== 'Booked' && lead.stage !== 'Lost' && (
        <Button
          size="sm"
          onClick={() => setIsBookingModalOpen(true)}
          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Book Unit
        </Button>
      )}
    </div>
  );

  return (
    <DashboardShell
      title={`${lead.first_name} ${lead.last_name}`}
      subtitle={`Lead Profile • Registered ${new Date(lead.created_at).toLocaleDateString()}`}
      actionButton={headerActions}
    >
      <div className="space-y-6">
        {/* Top Status Strip */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border shadow-2xs">
          <div className="flex items-center gap-3">
            <StageBadge stage={lead.stage} />
            <span className="text-xs text-muted-foreground">
              Interested in <strong className="text-foreground">{lead.preferred_type || 'Any Unit'}</strong>
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            Lead ID: <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">{lead.id}</code>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Lead Overview Card */}
          <div className="space-y-6">
            <Card className="shadow-2xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prospect Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Contact Info */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="font-mono font-medium text-foreground">{lead.phone}</span>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="text-foreground">{lead.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      Budget: <strong>${lead.budget_min.toLocaleString()}</strong> – <strong>${lead.budget_max.toLocaleString()}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-3.5 w-3.5" />
                    <span>Preference: <strong>{lead.preferred_type || 'Open'}</strong></span>
                  </div>
                </div>

                {/* Source */}
                <div className="pt-3 border-t border-border/60 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Source:</span>
                  <span className="font-medium bg-muted px-2 py-0.5 rounded text-foreground">
                    {lead.source}
                  </span>
                </div>

                {/* Stage Selection */}
                <div className="pt-3 border-t border-border/60 space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground">Current Pipeline Stage</Label>
                  <Select value={lead.stage} onValueChange={(val) => val && handleStageChange(val as LeadStage)}>
                    <SelectTrigger className="w-full text-xs h-8 bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STAGES.map((st) => (
                        <SelectItem key={st} value={st} className="text-xs">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned Rep Reassignment */}
                <div className="pt-3 border-t border-border/60 space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    Assigned Sales Representative
                  </Label>
                  <Select
                    value={lead.assigned_to || ''}
                    onValueChange={(val) => val && handleAssignChange(val)}
                  >
                    <SelectTrigger className="w-full text-xs h-8 bg-muted/30">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          {p.full_name} ({p.role === 'admin' ? 'Admin' : 'Rep'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Interaction Timeline & Notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add Note Card */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Log Note & Schedule Follow-Up
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleAddNote} className="space-y-3">
                  <Input
                    required
                    placeholder="e.g. Conducted site visit today. Client requested high floor corner unit..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="text-xs bg-muted/30"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="nextFollowUp" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Next Follow-Up:
                      </Label>
                      <Input
                        id="nextFollowUp"
                        type="date"
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-auto text-xs h-8 bg-muted/30"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={savingNote || !noteText.trim()}
                      size="sm"
                      className="h-8 text-xs font-medium flex items-center gap-1.5"
                    >
                      <Send className="h-3 w-3" />
                      {savingNote ? 'Posting...' : 'Save Note'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Timeline of Notes */}
            <Card className="shadow-2xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Activity Timeline ({lead.notes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {lead.notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-6">
                    No notes recorded yet. Add the first sales note above!
                  </p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {lead.notes.map((note) => (
                      <div key={note.id} className="relative">
                        <div className="absolute -left-6 top-1.5 h-2.5 w-2.5 rounded-full border border-background bg-primary" />

                        <div className="bg-muted/30 p-3 rounded-lg border border-border/60 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {note.author_profile?.full_name || 'Sales Representative'}
                            </span>
                            <span className="text-[10px]">
                              {new Date(note.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-foreground leading-relaxed">
                            {note.note}
                          </p>

                          {note.follow_up_date && (
                            <div className="pt-1 flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded w-fit border border-amber-200 dark:border-amber-800">
                              <Calendar className="h-3 w-3 text-amber-600" />
                              <span>
                                Scheduled Follow-up: {new Date(note.follow_up_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        defaultLeadId={lead.id}
        onBookingSuccess={() => loadLeadData()}
      />
    </DashboardShell>
  );
}
