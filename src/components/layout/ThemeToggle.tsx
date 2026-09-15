'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    void Promise.resolve().then(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full px-0 text-muted-foreground">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`cursor-pointer text-xs ${theme === 'light' ? 'bg-muted font-semibold' : ''}`}
        >
          <Sun className="h-3.5 w-3.5 mr-2 text-foreground" />
          Light Mode
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`cursor-pointer text-xs ${theme === 'dark' ? 'bg-muted font-semibold' : ''}`}
        >
          <Moon className="h-3.5 w-3.5 mr-2 text-foreground" />
          Dark Mode
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`cursor-pointer text-xs ${theme === 'system' ? 'bg-muted font-semibold' : ''}`}
        >
          <span className="h-3.5 w-3.5 mr-2 flex items-center justify-center font-mono text-[10px]">💻</span>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
