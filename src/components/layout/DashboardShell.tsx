'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pathname = usePathname();

  // Auto-close the mobile drawer whenever the route changes
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent background scrolling while the mobile drawer is open
  React.useEffect(() => {
    if (!sidebarOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar (desktop static + mobile drawer) */}
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile drawer scrim */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden cursor-pointer"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          title={title}
          subtitle={subtitle}
          actionButton={actionButton}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-7xl w-full mx-auto space-y-6 overflow-x-clip">
          {children}
        </main>
      </div>
    </div>
  );
}
