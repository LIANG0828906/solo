import { useState, useEffect } from 'react';
import {
  Calendar,
  Guitar,
  Music,
  AlertCircle,
} from 'lucide-react';
import { dashboardApi } from '../api';
import type { DashboardStats } from '../types';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  delay: number;
  suffix?: string;
}

function StatCard({ title, value, icon: Icon, color, delay, suffix = '' }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, isVisible]);

  return (
    <div
      className={cn(
        'card-glass rounded-2xl p-6 transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-xl hover:shadow-[#e94560]/10',
        'opacity-0 translate-y-4',
        isVisible && 'animate-fade-in-up'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <p className="text-4xl font-bold text-white">
            {displayValue}
            {suffix}
          </p>
        </div>
        <div
          className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center',
            'bg-gradient-to-br',
            color
          )}
        >
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: '总演出数',
      value: stats?.totalGigs || 0,
      icon: Calendar,
      color: 'from-[#e94560] to-[#ff6b6b]',
      delay: 0,
    },
    {
      title: '设备总数',
      value: stats?.totalEquipment || 0,
      icon: Guitar,
      color: 'from-[#0f3460] to-[#1e5f99]',
      delay: 100,
    },
    {
      title: '排练完成率',
      value: stats?.rehearsalCompletionRate || 0,
      icon: Music,
      color: 'from-[#10b981] to-[#34d399]',
      delay: 200,
      suffix: '%',
    },
    {
      title: '待处理事项',
      value: stats?.pendingItems || 0,
      icon: AlertCircle,
      color: 'from-[#f59e0b] to-[#fbbf24]',
      delay: 300,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          欢迎回来！
        </h1>
        <p className="text-gray-400">查看乐队的整体状态和待办事项</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            delay={card.delay}
            suffix={card.suffix}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="card-glass rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards', opacity: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">近期演出</h3>
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">暂无数据</p>
          </div>
        </div>

        <div
          className="card-glass rounded-2xl p-6 animate-fade-in-up"
          style={{ animationDelay: '500ms', animationFillMode: 'forwards', opacity: 0 }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">设备状态概览</h3>
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">暂无数据</p>
          </div>
        </div>
      </div>
    </div>
  );
}
