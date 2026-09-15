'use client';

import React, { useState, useEffect } from 'react';
import { Lead, LeadStage, LeadSource, LEAD_STAGES, Profile } from '@/lib/types/crm';
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
import { UserPlus, UserCheck } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lead: Lead) => void;
}

export function LeadModal({ isOpen, onClose, onSuccess }: LeadModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budgetMin, setBudgetMin] = useState('300000');
  const [budgetMax, setBudgetMax] = useState('600000');
  const [preferredType, setPreferredType] = useState('2BHK');
  const [source, setSource] = useState<LeadSource>('Website');
  const [stage, setStage] = useState<LeadStage>('New');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allProfiles = crmService.getAllProfiles();
      setProfiles(allProfiles);
      const defaultRep = allProfiles.find((p) => p.role === 'sales_rep') || allProfiles[0];
      if (defaultRep) setAssignedTo(defaultRep.id);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      toast.error('First name, last name, and phone are required.');
      return;
    }

    setLoading(true);
    try {
      const created = await crmService.createLead({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone,
        budget_min: parseFloat(budgetMin) || 0,
        budget_max: parseFloat(budgetMax) || 0,
        preferred_type: preferredType,
        source,
        stage,
        assigned_to: assignedTo || null,
      });

      toast.success(`Lead ${created.first_name} ${created.last_name} created successfully!`);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      if (onSuccess) onSuccess(created);
      onClose();
    } catch {
      toast.error('Failed to create lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-6 bg-card text-card-foreground border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-neutral-900">Add New Lead</DialogTitle>
              <DialogDescription className="text-xs text-neutral-500">
                Register a prospective property buyer into the sales pipeline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs font-semibold text-neutral-700">
                First Name *
              </Label>
              <Input
                id="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Jonathan"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs font-semibold text-neutral-700">
                Last Name *
              </Label>
              <Input
                id="lastName"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Reynolds"
              />
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-semibold text-neutral-700">
                Phone Number *
              </Label>
              <Input
                id="phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-neutral-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@domain.com"
              />
            </div>
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="budgetMin" className="text-xs font-semibold text-neutral-700">
                Min Budget ($)
              </Label>
              <Input
                id="budgetMin"
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="budgetMax" className="text-xs font-semibold text-neutral-700">
                Max Budget ($)
              </Label>
              <Input
                id="budgetMax"
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>

          {/* Preferences & Source */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Preferred Unit Type</Label>
              <Select value={preferredType} onValueChange={(val) => val && setPreferredType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1BHK">1BHK</SelectItem>
                  <SelectItem value="2BHK">2BHK</SelectItem>
                  <SelectItem value="3BHK">3BHK</SelectItem>
                  <SelectItem value="4BHK">4BHK</SelectItem>
                  <SelectItem value="Penthouse">Penthouse</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Lead Source</Label>
              <Select value={source} onValueChange={(val) => val && setSource(val as LeadSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Real Estate Portal">Real Estate Portal</SelectItem>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stage & Sales Assignment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700">Pipeline Stage</Label>
              <Select value={stage} onValueChange={(val) => val && setStage(val as LeadStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-neutral-500" />
                Assign Sales Rep
              </Label>
              <Select value={assignedTo} onValueChange={(val) => val && setAssignedTo(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales rep..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name} ({p.role === 'admin' ? 'Admin' : 'Rep'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Creating...' : 'Save Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
