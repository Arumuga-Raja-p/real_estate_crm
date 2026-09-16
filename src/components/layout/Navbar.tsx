'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  LayoutDashboard,
  CheckCircle2,
  RotateCcw,
  Shield,
  UserCheck,
  Zap,
} from 'lucide-react';
import { crmService } from '@/lib/crm-service';
import { Profile } from '@/lib/types/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function Navbar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    setCurrentUser(crmService.getCurrentUser());
    setProfiles(crmService.getAllProfiles());
  }, []);

  const handleSwitchUser = (userId: string) => {
    const updated = crmService.setCurrentUser(userId);
    setCurrentUser(updated);
    toast.success(`Switched active session to ${updated.full_name} (${updated.role === 'admin' ? 'Admin' : 'Sales Rep'})`);
    // Trigger custom event so views update
    window.dispatchEvent(new Event('crm-user-changed'));
  };

  const handleResetData = () => {
    crmService.resetDemo();
    toast.info('Demo inventory, leads, and bookings have been reset to default state.');
    window.dispatchEvent(new Event('crm-data-reset'));
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/leads', label: 'Leads & Pipeline', icon: Users },
    { href: '/properties', label: 'Inventory & Units', icon: Building2 },
    { href: '/bookings', label: 'Bookings Log', icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold text-foreground">EstateFlow</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Enterprise CRM</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-muted text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Demo Role Switcher & Reset Button */}
        <div className="flex items-center gap-3">
          {/* Quick Concurrency Test Shortcut */}
          <Link href="/properties?testConcurrency=true" className="hidden sm:inline-flex">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950 hover:text-amber-900 dark:hover:text-amber-200 flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
              Concurrency Test
            </Button>
          </Link>

          {/* Reset Demo Data Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetData}
            title="Reset to default seed data"
            className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Data</span>
          </Button>

          {/* Role & User Switcher */}
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-border bg-card/80 py-1 px-3 text-left transition hover:bg-card cursor-pointer">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {currentUser.role === 'admin' ? (
                    <Shield className="h-4 w-4 text-purple-600" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-xs leading-tight">
                  <span className="font-semibold text-foreground line-clamp-1">{currentUser.full_name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{currentUser.role === 'admin' ? 'Admin Role' : 'Sales Rep'}</span>
                </div>
                <Badge
                  variant={currentUser.role === 'admin' ? 'default' : 'secondary'}
                  className={`ml-1 text-[10px] font-bold px-1.5 py-0 uppercase ${
                    currentUser.role === 'admin' ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Admin' : 'Sales'}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  Switch Active Role (RBAC Demo)
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profiles.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => handleSwitchUser(p.id)}
                    className={`flex items-center justify-between cursor-pointer py-2 ${
                      p.id === currentUser.id ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">{p.full_name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.email}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase ${
                        p.role === 'admin' ? 'border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60' : 'border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60'
                      }`}
                    >
                      {p.role === 'admin' ? 'Admin' : 'Sales Rep'}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
