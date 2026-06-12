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
    <aside className="hidden lg:flex flex-col w-64 glass-nav p-6 z-20">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent-ride/10 border border-accent-ride/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <BarChart3 className="w-6 h-6 text-accent-ride" />
        </div>
        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-text-primary to-text-secondary bg-clip-text text-transparent">
          Strava Hub
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-accent-ride/20 text-text-primary border border-accent-ride/35 shadow-[0_0_12px_rgba(139,92,246,0.15)] font-semibold'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5">
        <p className="text-xs text-text-muted">
          Powered by Strava API
        </p>
      </div>
    </aside>
  );
}
