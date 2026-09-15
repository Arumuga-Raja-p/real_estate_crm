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
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-8 w-8 px-0 text-muted-foreground">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`cursor-pointer text-xs ${theme === 'light' ? 'bg-accent font-semibold' : ''}`}
        >
          <Sun className="h-3.5 w-3.5 mr-2 text-amber-500" />
          Light Mode
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`cursor-pointer text-xs ${theme === 'dark' ? 'bg-accent font-semibold' : ''}`}
        >
          <Moon className="h-3.5 w-3.5 mr-2 text-indigo-400" />
          Dark Mode
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`cursor-pointer text-xs ${theme === 'system' ? 'bg-accent font-semibold' : ''}`}
        >
          <span className="h-3.5 w-3.5 mr-2 flex items-center justify-center font-mono text-[10px]">💻</span>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
