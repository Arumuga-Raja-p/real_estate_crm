'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  LayoutDashboard,
  CheckCircle2,
  Shield,
  UserCheck,
  Zap,
  RotateCcw,
  ChevronsUpDown,
  FileCode2,
  User,
} from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Profile } from '@/lib/types/crm';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function AppSidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setCurrentUser(crmService.getCurrentUser());
      setProfiles(crmService.getAllProfiles());
    });

    const handleUserChange = () => {
      setCurrentUser(crmService.getCurrentUser());
    };
    window.addEventListener('crm-user-changed', handleUserChange);
    return () => window.removeEventListener('crm-user-changed', handleUserChange);
  }, []);

  const handleSwitchUser = (userId: string) => {
    const updated = crmService.setCurrentUser(userId);
    setCurrentUser(updated);
    toast.success(`Switched active session to ${updated.full_name} (${updated.role === 'admin' ? 'Admin' : 'Sales Rep'})`);
    window.dispatchEvent(new Event('crm-user-changed'));
  };

  const handleResetData = () => {
    crmService.resetDemo();
    toast.info('Demo inventory, leads, and bookings reset to defaults.');
    window.dispatchEvent(new Event('crm-data-reset'));
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/leads', label: 'Leads & Pipeline', icon: Users, badge: '7 Stages' },
    { href: '/properties', label: 'Inventory & Units', icon: Building2 },
    { href: '/bookings', label: 'Bookings Log', icon: CheckCircle2 },
    { href: '/profile', label: 'Profile & Settings', icon: User },
  ];

  return (
    <aside className="w-64 border-r border-border/60 bg-background flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Workspace / Brand Header */}
      <div className="h-20 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-foreground">
                EstateFlow
              </span>
              <Badge variant="secondary" className="rounded-full text-[9px] font-semibold px-1.5 py-0 h-4 bg-muted text-foreground">
                CRM
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Sales & Bookings Hub
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-7">
        {/* Main Nav */}
        <div>
          <div className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-full transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-normal ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/80'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Tools & Verification */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Concurrency & Tools
          </div>
          <div className="space-y-1">
            <Link
              href="/properties?testConcurrency=true"
            className="flex items-center justify-between px-4 py-3 text-xs font-medium rounded-full text-foreground bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-foreground" />
                <span>Concurrency Clash Test</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Lock</span>
            </Link>

            <button
              type="button"
              onClick={handleResetData}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                <span>Reset Demo Seed Data</span>
              </div>
            </button>
          </div>
        </div>

        <Separator />

        {/* Backend & RLS Status Box */}
        <div className="p-4 rounded-3xl border border-border/70 bg-card text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
              <FileCode2 className="h-3.5 w-3.5 text-foreground" />
              Supabase RLS & RPC
            </span>
            <Badge variant="outline" className="rounded-full text-[9px] bg-background text-foreground border-border">
              Active
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Atomic row lock <code className="bg-muted px-1 rounded font-mono text-[10px]">FOR UPDATE</code> active for unit bookings.
          </p>
        </div>
      </div>

      {/* User Profile & Role Switcher Footer */}
      {currentUser && (
        <div className="p-4 border-t border-border/60 bg-background">
          <div className="flex items-center justify-between p-2 rounded-3xl border border-border/70 bg-card hover:border-foreground/20 transition-colors">
            {/* Direct Link to Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-2xl hover:bg-muted transition text-left cursor-pointer group"
              title="Click to view and edit profile"
            >
              <div className="relative shrink-0">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="h-8 w-8 rounded-full object-cover border border-border group-hover:ring-2 group-hover:ring-foreground/20 transition"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground font-bold text-xs border border-border transition">
                    {currentUser.role === 'admin' ? (
                      <Shield className="h-4 w-4 text-foreground" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-foreground" />
                    )}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate transition-colors">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {currentUser.email}
                </div>
              </div>
            </Link>

            {/* Role Switcher Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
                title="Switch Role or Account"
              >
                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle user menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-64 mb-2">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer text-xs font-medium py-2">
                      <User className="h-3.5 w-3.5 mr-2 text-foreground" />
                    View & Edit Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-2 py-1">
                  Switch Active Role
                </DropdownMenuLabel>
                {profiles.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => handleSwitchUser(p.id)}
                    className={`flex items-center justify-between py-2 cursor-pointer ${
                      p.id === currentUser.id ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-foreground truncate">{p.full_name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{p.email}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase shrink-0 ml-2 ${
                        p.role === 'admin'
                          ? 'border-border text-foreground bg-muted'
                          : 'border-border text-foreground bg-background'
                      }`}
                    >
                      {p.role === 'admin' ? 'Admin' : 'Sales'}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </aside>
  );
}
