import React from 'react';
import { LeadStage } from '@/lib/types/crm';
import { Badge } from '@/components/ui/badge';

interface StageBadgeProps {
  stage: LeadStage;
  className?: string;
}

const STAGE_CONFIG: Record<
  LeadStage,
  { bg: string; text: string; border: string; label: string }
> = {
  New: {
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-900',
    label: 'New Lead',
  },
  Contacted: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/60',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-900',
    label: 'Contacted',
  },
  'Site Visit': {
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-900',
    label: 'Site Visit',
  },
  Interested: {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-900',
    label: 'Interested',
  },
  Negotiation: {
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-900',
    label: 'Negotiation',
  },
  Booked: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-900',
    label: 'Booked Deal',
  },
  Lost: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    label: 'Lost',
  },
};

export function StageBadge({ stage, className = '' }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.New;

  return (
    <Badge
      variant="outline"
      className={`font-semibold text-xs px-2.5 py-0.5 rounded-full border shadow-2xs inline-flex items-center gap-1.5 ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${stage === 'Booked' ? 'bg-emerald-600 dark:bg-emerald-400' : stage === 'Lost' ? 'bg-muted-foreground' : 'bg-current'}`} />
      {config.label}
    </Badge>
  );
}
