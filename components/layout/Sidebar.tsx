'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Activity, TrendingUp, Home } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/activities', icon: Activity, label: 'Activities' },
  { href: '/stats', icon: TrendingUp, label: 'Stats' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-border p-6">
      <div className="mb-8 flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-accent-ride" />
        <span className="font-bold text-xl">Strava</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-accent-ride text-white'
                  : 'text-text-secondary hover:bg-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-border">
        <p className="text-xs text-text-muted">
          Powered by Strava API
        </p>
      </div>
    </aside>
  );
}
