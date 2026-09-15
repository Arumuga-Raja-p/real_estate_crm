'use client';

import React, { useState, useEffect } from 'react';
import { PropertyUnit, Lead } from '@/lib/types/crm';
import { crmService } from '@/lib/crm-service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, CheckCircle2, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';

interface ConcurrencyTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinished?: () => void;
}

export function ConcurrencyTestModal({
  isOpen,
  onClose,
  onFinished,
}: ConcurrencyTestModalProps) {
  const [targetUnit, setTargetUnit] = useState<PropertyUnit | null>(null);
  const [testLeads, setTestLeads] = useState<Lead[]>([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{
    userA: { status: 'idle' | 'success' | 'error'; message: string; timestamp?: string };
    userB: { status: 'idle' | 'success' | 'error'; message: string; timestamp?: string };
  }>({
    userA: { status: 'idle', message: 'Waiting to fire transaction...' },
    userB: { status: 'idle', message: 'Waiting to fire transaction...' },
  });

  useEffect(() => {
    if (isOpen) {
      setupTest();
    }
  }, [isOpen]);

  const setupTest = async () => {
    const units = await crmService.getUnits({ status: 'Available' });
    const leads = await crmService.getLeads();
    const available = units[0] || null;
    setTargetUnit(available);
    setTestLeads(leads.slice(0, 2));
    setResults({
      userA: { status: 'idle', message: 'Ready to submit booking for Agent 1 (John)' },
      userB: { status: 'idle', message: 'Ready to submit booking for Agent 2 (Rachel)' },
    });
  };

  const runConcurrencyClash = async () => {
    if (!targetUnit || testLeads.length < 2) return;

    setRunning(true);
    const unitId = targetUnit.id;
    const leadA = testLeads[0];
    const leadB = testLeads[1];

    // Fire both requests concurrently at the same time
    const promiseA = crmService
      .bookPropertyUnit({
        leadId: leadA.id,
        unitId,
        bookingAmount: 50000,
        notes: 'Simulated race-condition Request A',
      })
      .then((res) => ({
        success: true,
        message: res.message,
      }))
      .catch((err) => ({
        success: false,
        message: err.message || 'Rejected by lock',
      }));

    const promiseB = crmService
      .bookPropertyUnit({
        leadId: leadB.id,
        unitId,
        bookingAmount: 50000,
        notes: 'Simulated race-condition Request B',
      })
      .then((res) => ({
        success: true,
        message: res.message,
      }))
      .catch((err) => ({
        success: false,
        message: err.message || 'Rejected by lock',
      }));

    const [resA, resB] = await Promise.all([promiseA, promiseB]);

    setResults({
      userA: {
        status: resA.success ? 'success' : 'error',
        message: resA.message,
        timestamp: new Date().toLocaleTimeString(),
      },
      userB: {
        status: resB.success ? 'success' : 'error',
        message: resB.message,
        timestamp: new Date().toLocaleTimeString(),
      },
    });

    setRunning(false);
    if (onFinished) onFinished();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] p-6 bg-card text-card-foreground border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Zap className="h-5 w-5 fill-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                Double-Booking Concurrency Test
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Fires 2 simultaneous requests at the exact same millisecond to book the same unit.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {targetUnit ? (
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-neutral-800">Target Unit for Clash: </span>
                <span className="font-bold text-indigo-600">
                  {targetUnit.unit_number} ({targetUnit.type})
                </span>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                Initial Status: Available
              </Badge>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-700">
              No available units found. Please reset demo data to run this test.
            </div>
          )}

          {/* Side by side simulated agents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Agent A Box */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                results.userA.status === 'success'
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : results.userA.status === 'error'
                  ? 'border-rose-300 bg-rose-50/50'
                  : 'border-neutral-200 bg-neutral-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-800">Agent A: John Doe</span>
                {results.userA.status === 'success' && (
                  <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> SECURED
                  </Badge>
                )}
                {results.userA.status === 'error' && (
                  <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> CONFLICT BLOCKED
                  </Badge>
                )}
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed min-h-[44px]">
                {results.userA.message}
              </p>
              {results.userA.timestamp && (
                <span className="text-[10px] text-neutral-400 block mt-2">
                  Time: {results.userA.timestamp}
                </span>
              )}
            </div>

            {/* Agent B Box */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                results.userB.status === 'success'
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : results.userB.status === 'error'
                  ? 'border-rose-300 bg-rose-50/50'
                  : 'border-neutral-200 bg-neutral-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-800">Agent B: Rachel Green</span>
                {results.userB.status === 'success' && (
                  <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> SECURED
                  </Badge>
                )}
                {results.userB.status === 'error' && (
                  <Badge variant="destructive" className="text-[10px] flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> CONFLICT BLOCKED
                  </Badge>
                )}
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed min-h-[44px]">
                {results.userB.message}
              </p>
              {results.userB.timestamp && (
                <span className="text-[10px] text-neutral-400 block mt-2">
                  Time: {results.userB.timestamp}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-blue-50/70 border border-blue-200 p-3 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Locking Guarantee: </span>
              In production with Supabase, PostgreSQL executes{' '}
              <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-[11px]">
                SELECT FOR UPDATE
              </code>{' '}
              with a partial unique index, guaranteeing exactly one request wins while the other fails safely.
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={running}>
            Close
          </Button>
          <Button
            type="button"
            onClick={runConcurrencyClash}
            disabled={running || !targetUnit}
            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
          >
            {running ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Executing Clash...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-white" />
                Simulate Concurrent Collision
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
