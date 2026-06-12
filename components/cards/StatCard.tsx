'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  unit?: string;
}

export function StatCard({ label, value, icon, unit }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="bg-surface border border-border rounded-2xl p-5 cursor-pointer hover:bg-opacity-80 transition-colors h-32 flex flex-col justify-between"
    >
      {icon && <div className="mb-3 text-2xl opacity-70">{icon}</div>}
      <p className="text-xs uppercase tracking-wider text-text-secondary mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-semibold font-mono text-text-primary">
          {value}
        </p>
        {unit && <span className="text-sm text-text-secondary">{unit}</span>}
      </div>
    </motion.div>
  );
}
