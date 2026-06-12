'use client';

import { Menu } from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <div className="lg:hidden sticky top-0 bg-surface border-b border-border px-4 py-4 z-10">
      <div className="flex items-center justify-between">
        <div>
          {title && (
            <h1 className="text-lg font-bold text-text-primary">{title}</h1>
          )}
          {subtitle && (
            <p className="text-xs text-text-secondary">{subtitle}</p>
          )}
        </div>
        <Menu className="w-6 h-6" />
      </div>
    </div>
  );
}
