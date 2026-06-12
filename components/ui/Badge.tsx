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
    run: 'bg-accent-run/20 text-accent-run border border-accent-run/30',
    ride: 'bg-accent-ride/20 text-accent-ride border border-accent-ride/30',
    walk: 'bg-accent-walk/20 text-accent-walk border border-accent-walk/30',
    pr: 'bg-accent-pr/20 text-accent-pr border border-accent-pr/30',
  };

  return (
    <span
      className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
