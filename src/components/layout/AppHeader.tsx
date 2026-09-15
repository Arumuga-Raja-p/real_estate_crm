'use client';

import React, { useState, useEffect } from 'react';
import { crmService } from '@/lib/crm-service';
import { Profile } from '@/lib/types/crm';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Bell, Shield, UserCheck, Sparkles, Building2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actionButton }: AppHeaderProps) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    setCurrentUser(crmService.getCurrentUser());
    const handleUserChange = () => setCurrentUser(crmService.getCurrentUser());
    window.addEventListener('crm-user-changed', handleUserChange);
    return () => window.removeEventListener('crm-user-changed', handleUserChange);
  }, []);

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-4">
        {title ? (
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">EstateFlow</span>
            <span>/</span>
            <span className="text-foreground">Workspace</span>
          </div>
        )}
      </div>

      {/* Right: Search, Notifications, Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search leads, units, records..."
            className="h-8 pl-8 pr-10 text-xs bg-muted/40 border-border/80 focus-visible:ring-1"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex">
            ⌘K
          </kbd>
        </div>

        {/* Active Role & Profile Indicator */}
        {currentUser && (
          <Link
            href="/profile"
            className="flex items-center gap-1.5 hover:opacity-85 transition cursor-pointer"
            title="Manage Profile & Settings"
          >
            {currentUser.avatar_url && (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="h-6 w-6 rounded-full object-cover border border-border"
              />
            )}
            <Badge
              variant={currentUser.role === 'admin' ? 'default' : 'secondary'}
              className={`text-[10px] font-semibold py-0.5 px-2 flex items-center gap-1 uppercase tracking-wider cursor-pointer ${
                currentUser.role === 'admin'
                  ? 'bg-purple-700 hover:bg-purple-800 text-white'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900'
              }`}
            >
              {currentUser.role === 'admin' ? (
                <Shield className="h-3 w-3" />
              ) : (
                <UserCheck className="h-3 w-3" />
              )}
              {currentUser.role === 'admin' ? 'Admin Access' : 'Sales Rep'}
            </Badge>
          </Link>
        )}

        {/* Dark / Light Mode Toggle */}
        <ThemeToggle />

        {actionButton}
      </div>
    </header>
  );
}
