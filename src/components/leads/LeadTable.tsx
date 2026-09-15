'use client';

import React from 'react';
import { Lead, LeadStage, LEAD_STAGES } from '@/lib/types/crm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StageBadge } from './StageBadge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, User } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: LeadStage) => void;
  onBookLead: (lead: Lead) => void;
}

export function LeadTable({ leads, onStageChange, onBookLead }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">No leads found matching current filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-2xs overflow-hidden">
      <Table>
        <TableHeader className="bg-neutral-50/80">
          <TableRow>
            <TableHead className="font-semibold text-neutral-700">Lead Name</TableHead>
            <TableHead className="font-semibold text-neutral-700">Contact</TableHead>
            <TableHead className="font-semibold text-neutral-700">Budget Range</TableHead>
            <TableHead className="font-semibold text-neutral-700">Source</TableHead>
            <TableHead className="font-semibold text-neutral-700">Assigned To</TableHead>
            <TableHead className="font-semibold text-neutral-700">Pipeline Stage</TableHead>
            <TableHead className="font-semibold text-neutral-700 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-neutral-50/60 transition-colors">
              <TableCell className="font-medium">
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-bold text-neutral-900 hover:text-indigo-600 transition flex flex-col"
                >
                  <span>
                    {lead.first_name} {lead.last_name}
                  </span>
                  <span className="text-[11px] font-normal text-neutral-500">
                    Interested in {lead.preferred_type || 'General Units'}
                  </span>
                </Link>
              </TableCell>

              <TableCell className="text-xs text-neutral-600">
                <div className="font-mono text-neutral-700">{lead.phone}</div>
                <div className="text-neutral-400 text-[11px] truncate max-w-[140px]">
                  {lead.email || 'No email'}
                </div>
              </TableCell>

              <TableCell className="text-xs font-medium text-neutral-800">
                ${lead.budget_min.toLocaleString()} – ${lead.budget_max.toLocaleString()}
              </TableCell>

              <TableCell>
                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 font-medium">
                  {lead.source}
                </span>
              </TableCell>

              <TableCell className="text-xs text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{lead.assigned_profile?.full_name || 'Unassigned'}</span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-2">
                  <StageBadge stage={lead.stage} />
                  {lead.stage !== 'Booked' && lead.stage !== 'Lost' && (
                    <Select
                      value={lead.stage}
                      onValueChange={(val) => val && onStageChange(lead.id, val as LeadStage)}
                    >
                      <SelectTrigger className="h-7 w-[105px] text-[11px] border-dashed border-neutral-300">
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
                  )}
                </div>
              </TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {lead.stage !== 'Booked' && lead.stage !== 'Lost' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onBookLead(lead)}
                      className="h-7 text-xs border-emerald-300 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      Book Unit
                    </Button>
                  )}
                  <Link href={`/leads/${lead.id}`}>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-neutral-500">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
