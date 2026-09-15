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
  Sparkles,
  Layers,
  FileCode2,
  User,
} from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Profile } from '@/lib/types/crm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    setCurrentUser(crmService.getCurrentUser());
    setProfiles(crmService.getAllProfiles());

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
    <aside className="w-64 border-r border-border bg-background flex flex-col shrink-0 h-screen sticky top-0 select-none">
      {/* Workspace / Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-foreground">
                EstateFlow
              </span>
              <Badge variant="secondary" className="text-[9px] font-semibold px-1 py-0 h-4">
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
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Main Nav */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Platform
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] text-muted-foreground/80 font-normal">
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
              className="flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md text-amber-800 bg-amber-50/70 border border-amber-200/80 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-amber-600 fill-amber-500" />
                <span>Concurrency Clash Test</span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 uppercase">Lock</span>
            </Link>

            <button
              type="button"
              onClick={handleResetData}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer text-left"
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
        <div className="p-3 rounded-lg border border-border/80 bg-muted/30 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
              <FileCode2 className="h-3.5 w-3.5 text-primary" />
              Supabase RLS & RPC
            </span>
            <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-300">
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
        <div className="p-3 border-t border-border bg-background">
          <div className="flex items-center justify-between p-1.5 rounded-lg border border-border/70 bg-card hover:border-primary/40 transition-colors">
            {/* Direct Link to Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 p-1 rounded-md hover:bg-accent transition text-left cursor-pointer group"
              title="Click to view and edit profile"
            >
              <div className="relative shrink-0">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="h-8 w-8 rounded-full object-cover border border-border group-hover:ring-2 group-hover:ring-primary/40 transition"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs border border-border group-hover:bg-primary/20 transition">
                    {currentUser.role === 'admin' ? (
                      <Shield className="h-4 w-4 text-purple-600" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
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
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
                title="Switch Role or Account"
              >
                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle user menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="end" className="w-64 mb-2">
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer text-xs font-medium py-2">
                    <User className="h-3.5 w-3.5 mr-2 text-primary" />
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
                      p.id === currentUser.id ? 'bg-accent font-medium' : ''
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
                          ? 'border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950 dark:text-purple-300'
                          : 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300'
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
