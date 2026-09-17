'use client';

import React, { useState, useEffect } from 'react';
import { crmService } from '@/lib/crm-service';
import { Profile } from '@/lib/types/crm';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, UserCheck, Menu } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  onMenuClick?: () => void;
}

export function AppHeader({ title, subtitle, actionButton, onMenuClick }: AppHeaderProps) {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => setCurrentUser(crmService.getCurrentUser()));
    const handleUserChange = () => setCurrentUser(crmService.getCurrentUser());
    window.addEventListener('crm-user-changed', handleUserChange);
    return () => window.removeEventListener('crm-user-changed', handleUserChange);
  }, []);

  return (
    <header className="min-h-16 sm:min-h-20 border-b border-border/60 bg-background/95 backdrop-blur-sm sticky top-0 z-30 px-4 py-3 sm:px-6 lg:px-8 sm:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      {/* Top row: menu + title + mobile actions */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
        {/* Hamburger (mobile / tablet only) */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted transition cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>
        {title ? (
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground leading-tight truncate">
              {title}
            </h1>
            {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 max-w-xl leading-snug line-clamp-2">{subtitle}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <span className="font-semibold text-foreground">EstateFlow</span>
            <span>/</span>
            <span className="text-foreground truncate">Workspace</span>
          </div>
        )}
        {/* Mobile theme toggle next to title */}
        <div className="sm:hidden shrink-0">
          <ThemeToggle />
        </div>
      </div>

      {/* Right: Search, Role, Actions — wraps below title on mobile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap sm:justify-end">
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
            className="flex items-center gap-1.5 hover:opacity-85 transition cursor-pointer min-w-0"
            title="Manage Profile & Settings"
          >
            {currentUser.avatar_url && (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="h-6 w-6 rounded-full object-cover border border-border shrink-0"
              />
            )}
            <Badge
              variant={currentUser.role === 'admin' ? 'default' : 'secondary'}
              className={`rounded-full text-[10px] font-semibold py-1 px-2 sm:px-3 flex items-center gap-1 uppercase tracking-wider cursor-pointer whitespace-nowrap ${
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
              <span className="hidden sm:inline">
                {currentUser.role === 'admin' ? 'Admin Access' : 'Sales Rep'}
              </span>
              <span className="sm:hidden">
                {currentUser.role === 'admin' ? 'Admin' : 'Sales'}
              </span>
            </Badge>
          </Link>
        )}

        {/* Dark / Light Mode Toggle (tablet/desktop; mobile sits next to title) */}
        <div className="hidden sm:block shrink-0">
          <ThemeToggle />
        </div>

        {actionButton && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0 [&>*]:max-w-full">
            {actionButton}
          </div>
        )}
      </div>
    </header>
  );
}
