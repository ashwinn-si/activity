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
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer h-32 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between w-full">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </p>
        {icon && (
          <div className="text-accent-ride/80 flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 border border-white/5 shadow-sm">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 mt-auto">
        <p className="text-3xl font-bold font-mono text-text-primary tracking-tight">
          {value}
        </p>
        {unit && <span className="text-xs font-semibold text-text-secondary">{unit}</span>}
      </div>
    </motion.div>
  );
}
