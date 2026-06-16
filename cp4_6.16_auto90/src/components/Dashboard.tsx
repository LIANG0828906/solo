import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle?: string;
  color: string;
  progress?: number;
  delay: number;
}

const StatCard = memo(function StatCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color, 
  progress,
  delay 
}: StatCardProps) {
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = progress !== undefined 
    ? circumference - (progress / 100) * circumference 
    : circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-xl border-2 border-gray-200 p-4
                 hover:shadow-card-hover hover:-translate-y-1
                 transition-all duration-300 ease-elastic"
      style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <div className="flex items-start gap-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        
        {progress !== undefined && (
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="28"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="4"
              />
              <motion.circle
                cx="28"
                cy="28"
                r="28"
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold" style={{ color }}>{progress}%</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

interface DashboardProps {
  className?: string;
}

export const Dashboard = memo(function Dashboard({ className }: DashboardProps) {
  const { getPublishedCount, getInProgressCount, getThisWeekMilestones, getCompletionRate } = useProjectStore();

  const stats = useMemo(() => {
    return [
      {
        icon: <CheckCircle className="w-6 h-6" />,
        title: '已发布版本',
        value: getPublishedCount(),
        color: '#4caf50',
        progress: undefined as number | undefined,
      },
      {
        icon: <Clock className="w-6 h-6" />,
        title: '进行中版本',
        value: getInProgressCount(),
        color: '#2196f3',
        progress: undefined as number | undefined,
      },
      {
        icon: <Target className="w-6 h-6" />,
        title: '本周里程碑',
        value: getThisWeekMilestones(),
        color: '#ff9800',
        progress: undefined as number | undefined,
      },
      {
        icon: <TrendingUp className="w-6 h-6" />,
        title: '总体完成率',
        value: getCompletionRate(),
        subtitle: '所有项目里程碑',
        color: '#1a237e',
        progress: getCompletionRate(),
      },
    ];
  }, [getPublishedCount, getInProgressCount, getThisWeekMilestones, getCompletionRate]);

  return (
    <div className={cn('p-4', className)}>
      <h2 className="text-lg font-bold text-gray-800 mb-4">数据概览</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            color={stat.color}
            progress={stat.progress}
            delay={index * 0.08}
          />
        ))}
      </div>
    </div>
  );
});
