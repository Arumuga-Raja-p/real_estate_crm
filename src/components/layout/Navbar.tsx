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
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-neutral-900">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold text-neutral-900">EstateFlow</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Enterprise CRM</span>
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
                      ? 'bg-neutral-100 text-neutral-900 font-semibold shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-neutral-400'}`} />
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
              className="text-xs border-amber-300 bg-amber-50/50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 flex items-center gap-1.5"
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
            className="text-neutral-500 hover:text-neutral-900 text-xs flex items-center gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Data</span>
          </Button>

          {/* Role & User Switcher */}
          {currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-neutral-200 bg-neutral-50/80 py-1 px-3 text-left transition hover:bg-neutral-100 cursor-pointer">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700">
                  {currentUser.role === 'admin' ? (
                    <Shield className="h-4 w-4 text-purple-600" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-xs leading-tight">
                  <span className="font-semibold text-neutral-800 line-clamp-1">{currentUser.full_name}</span>
                  <span className="text-[10px] text-neutral-500 capitalize">{currentUser.role === 'admin' ? 'Admin Role' : 'Sales Rep'}</span>
                </div>
                <Badge
                  variant={currentUser.role === 'admin' ? 'default' : 'secondary'}
                  className={`ml-1 text-[10px] font-bold px-1.5 py-0 uppercase ${
                    currentUser.role === 'admin' ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Admin' : 'Sales'}
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                  Switch Active Role (RBAC Demo)
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {profiles.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => handleSwitchUser(p.id)}
                    className={`flex items-center justify-between cursor-pointer py-2 ${
                      p.id === currentUser.id ? 'bg-neutral-100 font-medium' : ''
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-neutral-900">{p.full_name}</span>
                      <span className="text-[11px] text-neutral-500">{p.email}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] uppercase ${
                        p.role === 'admin' ? 'border-purple-300 text-purple-700 bg-purple-50' : 'border-blue-300 text-blue-700 bg-blue-50'
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
