'use client';

import React from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export function DashboardShell({
  children,
  title,
  subtitle,
  actionButton,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader title={title} subtitle={subtitle} actionButton={actionButton} />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
