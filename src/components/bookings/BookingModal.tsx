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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, ShieldAlert, Sparkles, Building2, User } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLeadId?: string;
  defaultUnitId?: string;
  onBookingSuccess?: () => void;
}

export function BookingModal({
  isOpen,
  onClose,
  defaultLeadId,
  defaultUnitId,
  onBookingSuccess,
}: BookingModalProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [availableUnits, setAvailableUnits] = useState<PropertyUnit[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(defaultLeadId || '');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(defaultUnitId || '');
  const [bookingAmount, setBookingAmount] = useState<string>('25000');
  const [notes, setNotes] = useState<string>('Initial deposit paid. Ready for agreement signing.');
  const [loading, setLoading] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConflictError(null);
      loadData();
    }
  }, [isOpen, defaultLeadId, defaultUnitId]);

  const loadData = async () => {
    const allLeads = await crmService.getLeads();
    // Exclude leads that are already booked or lost, unless it is defaultLeadId
    const eligibleLeads = allLeads.filter(
      (l) => l.stage !== 'Booked' && l.stage !== 'Lost' || l.id === defaultLeadId
    );
    setLeads(eligibleLeads);

    const units = await crmService.getUnits({ status: 'Available' });
    setAvailableUnits(units);

    if (defaultLeadId) setSelectedLeadId(defaultLeadId);
    else if (eligibleLeads.length > 0 && !selectedLeadId) setSelectedLeadId(eligibleLeads[0].id);

    if (defaultUnitId) {
      setSelectedUnitId(defaultUnitId);
      // Auto compute token (e.g. 5% of price)
      const u = units.find((item) => item.id === defaultUnitId);
      if (u) setBookingAmount(Math.round(u.price * 0.05).toString());
    } else if (units.length > 0 && !selectedUnitId) {
      setSelectedUnitId(units[0].id);
      setBookingAmount(Math.round(units[0].price * 0.05).toString());
    }
  };

  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    setConflictError(null);
    const u = availableUnits.find((item) => item.id === unitId);
    if (u) {
      setBookingAmount(Math.round(u.price * 0.05).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !selectedUnitId) {
      toast.error('Please select both a lead and a property unit.');
      return;
    }

    const amountNum = parseFloat(bookingAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid positive booking amount.');
      return;
    }

    setLoading(true);
    setConflictError(null);

    try {
      const res = await crmService.bookPropertyUnit({
        leadId: selectedLeadId,
        unitId: selectedUnitId,
        bookingAmount: amountNum,
        notes,
      });

      toast.success(res.message, {
        icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
        duration: 5000,
      });

      if (onBookingSuccess) onBookingSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm booking';
      setConflictError(msg);
      toast.error(msg, {
        icon: <AlertCircle className="h-5 w-5 text-rose-600" />,
        duration: 6000,
      });
      // Refresh available units list to remove the conflicting unit
      const refreshedUnits = await crmService.getUnits({ status: 'Available' });
      setAvailableUnits(refreshedUnits);
    } finally {
      setLoading(false);
    }
  };

  const currentUnit = availableUnits.find((u) => u.id === selectedUnitId);
  const currentLead = leads.find((l) => l.id === selectedLeadId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] p-6 bg-card text-card-foreground border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">
                Confirm Property Booking
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Assign unit to customer and execute concurrency-safe lock.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {conflictError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold">Booking Conflict Detected!</h4>
              <p className="text-xs text-rose-700 mt-1">{conflictError}</p>
              <p className="text-[11px] text-rose-600 mt-1">
                Our concurrency safeguard prevented a duplicate booking. Please choose another available unit below.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Lead Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-neutral-500" />
              Select Customer / Lead
            </Label>
            <Select value={selectedLeadId} onValueChange={(val) => val && setSelectedLeadId(val)}>
              <SelectTrigger className="w-full bg-neutral-50/50">
                <SelectValue placeholder="Choose a lead..." />
              </SelectTrigger>
              <SelectContent>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.first_name} {l.last_name} ({l.phone}) - {l.preferred_type || 'Any Unit'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentLead && (
              <div className="text-[11px] text-neutral-500 flex items-center justify-between px-1">
                <span>Budget: ${currentLead.budget_min.toLocaleString()} - ${currentLead.budget_max.toLocaleString()}</span>
                <span>Current Stage: <strong>{currentLead.stage}</strong></span>
              </div>
            )}
          </div>

          {/* Unit Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-neutral-500" />
              Select Available Unit
            </Label>
            <Select value={selectedUnitId} onValueChange={(val) => val && handleUnitChange(val)}>
              <SelectTrigger className="w-full bg-neutral-50/50">
                <SelectValue placeholder="Choose an available unit..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableUnits.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.unit_number} ({u.type}) - ${u.price.toLocaleString()} [{u.area_sqft} sqft, Flr {u.floor}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentUnit && (
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 text-xs space-y-1">
                <div className="flex justify-between font-medium text-neutral-800">
                  <span>Unit Price:</span>
                  <span className="text-sm font-bold text-indigo-600">${currentUnit.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Layout & Floor:</span>
                  <span>{currentUnit.type} • Floor {currentUnit.floor} ({currentUnit.area_sqft} sqft)</span>
                </div>
              </div>
            )}
          </div>

          {/* Token Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="tokenAmount" className="text-xs font-semibold text-neutral-700">
              Booking Token / Advance Amount ($)
            </Label>
            <Input
              id="tokenAmount"
              type="number"
              min="1"
              value={bookingAmount}
              onChange={(e) => setBookingAmount(e.target.value)}
              placeholder="e.g. 25000"
              required
              className="bg-neutral-50/50"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="bookingNotes" className="text-xs font-semibold text-neutral-700">
              Booking Agreement Notes
            </Label>
            <Input
              id="bookingNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment mode, receipt #, special terms..."
              className="bg-neutral-50/50"
            />
          </div>

          <DialogFooter className="pt-4 border-t border-neutral-100 flex items-center justify-between sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedUnitId || !selectedLeadId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              {loading ? 'Executing Atomic Lock...' : 'Confirm & Lock Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
