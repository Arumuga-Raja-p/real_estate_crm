'use client';

import React, { useState } from 'react';
import { Lead, LeadStage, LEAD_STAGES } from '@/lib/types/crm';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, DollarSign, User, ArrowRight, CheckCircle2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface LeadKanbanProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: LeadStage) => void;
  onBookLead: (lead: Lead) => void;
}

export function LeadKanban({ leads, onStageChange, onBookLead }: LeadKanbanProps) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);

  const getLeadsByStage = (stage: LeadStage) => leads.filter((l) => l.stage === stage);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(lead.id);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (stage: LeadStage) => {
    setDragOverStage(stage);
  };

  const handleDragLeave = (e: React.DragEvent, stage: LeadStage) => {
    const related = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(related)) return;
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.stage !== targetStage) {
      onStageChange(leadId, targetStage);
      toast.success(`Moved ${lead.first_name} ${lead.last_name} to "${targetStage}"`, {
        duration: 3000,
      });
    }
    setDraggedLeadId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x select-none">
      {LEAD_STAGES.map((stage) => {
        const stageLeads = getLeadsByStage(stage);
        const isBooked = stage === 'Booked';
        const isLost = stage === 'Lost';
        const isOver = dragOverStage === stage;

        return (
          <div
            key={stage}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(stage)}
            onDragLeave={(e) => handleDragLeave(e, stage)}
            onDrop={(e) => handleDrop(e, stage)}
            className={`flex-shrink-0 w-80 rounded-xl border-2 p-3 flex flex-col snap-start transition-all duration-200 ${
              isOver
                ? 'bg-primary/5 border-primary ring-2 ring-primary/30 scale-[1.01]'
                : 'bg-muted/40 border-border'
            }`}
          >
            {/* Stage Column Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isBooked
                      ? 'bg-emerald-500'
                      : isLost
                      ? 'bg-muted-foreground'
                      : stage === 'Interested'
                      ? 'bg-amber-500'
                      : 'bg-primary'
                  }`}
                />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {stage}
                </h3>
              </div>
              <Badge
                variant="secondary"
                className="text-[11px] font-semibold h-5 px-1.5 bg-background text-foreground border border-border"
              >
                {stageLeads.length}
              </Badge>
            </div>

            {/* Drop Target Hint */}
            {isOver && (
              <div className="mb-2 py-1.5 px-3 rounded-lg border border-dashed border-primary bg-primary/10 text-center text-xs text-primary font-medium animate-pulse">
                Drop to move to {stage}
              </div>
            )}

            {/* Cards List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-2.5">
              {stageLeads.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground italic border border-dashed border-border/60 rounded-lg">
                  Drag leads here
                </div>
              ) : (
                stageLeads.map((lead) => {
                  const isDragging = draggedLeadId === lead.id;

                  return (
                    <Card
                      key={lead.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onDragEnd={handleDragEnd}
                      className={`border-border/80 shadow-2xs hover:shadow-sm transition-all duration-150 bg-card group cursor-grab active:cursor-grabbing relative ${
                        isDragging ? 'opacity-40 ring-2 ring-primary scale-[0.98]' : ''
                      }`}
                    >
                      <CardContent className="p-3.5 space-y-2.5">
                        {/* Drag Handle & Lead Title */}
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 group-hover:text-muted-foreground transition-colors" />
                            <Link
                              href={`/leads/${lead.id}`}
                              className="font-semibold text-sm text-foreground hover:text-primary transition truncate"
                            >
                              {lead.first_name} {lead.last_name}
                            </Link>
                          </div>
                          {lead.preferred_type && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-medium border-border/80 bg-muted/50 text-foreground shrink-0"
                            >
                              {lead.preferred_type}
                            </Badge>
                          )}
                        </div>

                        {/* Contact & Budget Info */}
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">{lead.phone}</span>
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-foreground font-medium pt-1">
                            <DollarSign className="h-3 w-3 shrink-0 text-emerald-600" />
                            <span>
                              ${(lead.budget_min / 1000).toFixed(0)}k - $
                              {(lead.budget_max / 1000).toFixed(0)}k
                            </span>
                          </div>
                        </div>

                        {/* Assigned Rep & Source */}
                        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[110px]">
                              {lead.assigned_profile?.full_name?.split(' ')[0] || 'Unassigned'}
                            </span>
                          </div>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                            {lead.source}
                          </span>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-border/60">
                          <Link href={`/leads/${lead.id}`} className="text-xs text-primary hover:underline font-medium">
                            Notes
                          </Link>

                          <div className="flex items-center gap-1">
                            {stage !== 'Booked' && stage !== 'Lost' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onBookLead(lead)}
                                className="h-7 text-[11px] px-2 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                Book
                              </Button>
                            )}

                            {/* Quick Advance Button */}
                            {stage !== 'Booked' && stage !== 'Lost' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const currentIndex = LEAD_STAGES.indexOf(stage);
                                  if (currentIndex >= 0 && currentIndex < LEAD_STAGES.length - 2) {
                                    onStageChange(lead.id, LEAD_STAGES[currentIndex + 1]);
                                  }
                                }}
                                title="Advance to next pipeline stage"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
