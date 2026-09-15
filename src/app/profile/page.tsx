'use client';

import React, { useState, useEffect } from 'react';
import { crmService } from '@/lib/crm-service';
import { Profile, Lead, Booking } from '@/lib/types/crm';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Shield,
  Camera,
  CheckCircle2,
  Building2,
  Briefcase,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
];

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ assignedLeads: 0, closedBookings: 0 });

  useEffect(() => {
    loadUser();

    const handleUserChange = () => loadUser();
    window.addEventListener('crm-user-changed', handleUserChange);
    return () => window.removeEventListener('crm-user-changed', handleUserChange);
  }, []);

  const loadUser = async () => {
    const user = crmService.getCurrentUser();
    setCurrentUser(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setPhone(user.phone || '+1 (555) 782-9901');
    setAvatarUrl(user.avatar_url || '');

    // Compute user stats
    const allLeads = await crmService.getLeads();
    const allBookings = await crmService.getBookings();
    setStats({
      assignedLeads: allLeads.filter((l) => l.assigned_to === user.id).length,
      closedBookings: allBookings.filter((b) => b.booked_by === user.id).length,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!fullName.trim() || !email.trim()) {
      toast.error('Name and email are required fields.');
      return;
    }

    setSaving(true);
    try {
      const updated = await crmService.updateProfile(currentUser.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl || null,
      });

      setCurrentUser(updated);
      toast.success('Profile updated successfully!', {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
      });
      window.dispatchEvent(new Event('crm-user-changed'));
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
    setCustomAvatarInput('');
    toast.info('Avatar photo selected. Click "Save Profile Changes" to confirm.');
  };

  if (!currentUser) {
    return (
      <DashboardShell>
        <div className="p-12 text-center text-xs text-muted-foreground">Loading profile...</div>
      </DashboardShell>
    );
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <DashboardShell
      title="User Profile & Settings"
      subtitle="Manage your personal information, sales contact details, and display avatar."
    >
      <div className="max-w-4xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Main Profile Info Card */}
          <Card className="shadow-2xs">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Your contact information will appear on client booking documents and lead notes.
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                    currentUser.role === 'admin'
                      ? 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-900'
                      : 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Administrator' : 'Sales Representative'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Photo / Avatar Section */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-foreground">Profile Photo / Avatar</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <Avatar className="h-20 w-20 border-2 border-border shadow-xs">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={fullName} />
                    ) : null}
                    <AvatarFallback className="text-base font-bold bg-muted text-foreground">
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Pick a preset headshot:</span>
                      <div className="flex items-center gap-1.5">
                        {AVATAR_PRESETS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className={`h-8 w-8 rounded-full overflow-hidden border-2 transition-all hover:scale-105 cursor-pointer ${
                              avatarUrl === preset ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                            }`}
                          >
                            <img src={preset} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Or enter custom image URL (https://...)"
                        value={customAvatarInput}
                        onChange={(e) => {
                          setCustomAvatarInput(e.target.value);
                          setAvatarUrl(e.target.value);
                        }}
                        className="text-xs h-8 bg-muted/30"
                      />
                      {avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAvatarUrl('');
                            setCustomAvatarInput('');
                          }}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Grid: Name, Number, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className="text-xs bg-muted/30"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@realstate.com"
                    className="text-xs bg-muted/30"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone / Mobile Number *
                  </Label>
                  <Input
                    id="phone"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="text-xs bg-muted/30"
                  />
                </div>

                {/* System Role */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    Assigned Role & Permissions
                  </Label>
                  <Input
                    disabled
                    value={currentUser.role === 'admin' ? 'Administrator (Full Access)' : 'Sales Representative'}
                    className="text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t border-border/60 py-3 px-6 flex justify-end bg-muted/10">
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Representative Performance & Details Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Assigned Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.assignedLeads} Prospects</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active under management</p>
            </CardContent>
          </Card>

          <Card className="shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Secured Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.closedBookings} Units</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Closed transactions</p>
            </CardContent>
          </Card>

          <Card className="shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                CRM Member ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs font-mono font-bold text-foreground truncate mt-1">
                {currentUser.id}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Supabase Auth profile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
