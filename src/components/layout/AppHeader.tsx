'use client';

import React, { useState, useEffect } from 'react';
import { crmService } from '@/lib/crm-service';
import { Profile } from '@/lib/types/crm';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, UserCheck } from 'lucide-react';
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
    void Promise.resolve().then(() => setCurrentUser(crmService.getCurrentUser()));
    const handleUserChange = () => setCurrentUser(crmService.getCurrentUser());
    window.addEventListener('crm-user-changed', handleUserChange);
    return () => window.removeEventListener('crm-user-changed', handleUserChange);
  }, []);

  return (
    <header className="min-h-20 border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-30 px-8 py-4 flex items-center justify-between gap-6">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-4 min-w-0">
        {title ? (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-snug">{subtitle}</p>}
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
      <div className="flex items-center gap-3 shrink-0">
        {/* Global Search */}
        <div className="relative hidden lg:block w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search leads, units, records..."
            className="h-10 rounded-full pl-9 pr-10 text-sm bg-muted/60 border-transparent focus-visible:ring-1"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 select-none items-center gap-1 rounded-full border border-border bg-background px-2 font-mono text-[10px] font-medium text-muted-foreground flex">
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
              className={`rounded-full text-[10px] font-semibold py-1 px-3 flex items-center gap-1 uppercase tracking-wider cursor-pointer ${
                currentUser.role === 'admin'
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  : 'bg-muted text-foreground border-border'
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
