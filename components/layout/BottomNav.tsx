'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Activity, TrendingUp, GitCompare, Trophy } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/activities', icon: Activity, label: 'Activities' },
  { href: '/stats', icon: TrendingUp, label: 'Stats' },
  { href: '/records', icon: Trophy, label: 'Records' },
  { href: '/compare', icon: GitCompare, label: 'Compare' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-bottom-nav flex z-20 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 transition-all duration-300 ${
              isActive
                ? 'text-accent-ride bg-white/5 border-t-2 border-accent-ride font-semibold'
                : 'text-text-secondary hover:text-text-primary border-t-2 border-transparent'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
