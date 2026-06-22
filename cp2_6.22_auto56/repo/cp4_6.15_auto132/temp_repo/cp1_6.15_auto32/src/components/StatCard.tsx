import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  gradient: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, gradient, suffix }) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-5 shadow-soft
        bg-gradient-to-br ${gradient}
        transition-all duration-300 hover:shadow-softHover hover:-translate-y-0.5
      `}
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute -right-8 bottom-0 w-16 h-16 bg-white/5 rounded-full" />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 bg-white/25 backdrop-blur rounded-xl">
            <Icon className="text-white" size={22} />
          </div>
        </div>
        <div className="text-white/90 text-sm font-medium mb-1">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">{value}</span>
          {suffix && <span className="text-white/80 text-sm font-medium">{suffix}</span>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
