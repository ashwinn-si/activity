import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'run' | 'ride' | 'walk' | 'pr';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const variants = {
    default: 'bg-muted text-text-secondary',
    run: 'bg-blue-500/10 text-accent-run',
    ride: 'bg-orange-500/10 text-accent-ride',
    walk: 'bg-green-500/10 text-accent-walk',
    pr: 'bg-purple-500/10 text-accent-pr',
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
