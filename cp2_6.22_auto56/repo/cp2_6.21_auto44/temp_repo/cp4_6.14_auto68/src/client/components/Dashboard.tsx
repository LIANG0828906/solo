import { useState, useEffect, useRef } from 'react';
import { statsApi, type Stats } from '../api';

const easeOutQuad = (t: number): number => t * (2 - t);

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const duration = 500;
    const startTime = performance.now();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);
      const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return (
    <span style={{ fontSize: 32, fontWeight: 'bold', color }}>
      {displayValue.toLocaleString()}
    </span>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  suffix?: string;
}

function StatCard({ title, value, color, suffix = '' }: StatCardProps) {
  return (
    <div
      style={{
        backgroundColor: '#eff6ff',
        borderRadius: 10,
        padding: 20,
        borderLeft: `4px solid ${color}`,
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#334155', marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <AnimatedNumber value={value} color={color} />
        {suffix && <span style={{ color, fontSize: 18 }}>{suffix}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    totalSales: 0,
    popularItemClicks: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await statsApi.get();
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ padding: 32 }}>加载中...</div>;
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#1e293b' }}>
        统计概览
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
        }}
      >
        <StatCard title="今日订单总数" value={stats.todayOrders} color="#a855f7" />
        <StatCard title="总销售额" value={stats.totalSales} color="#22c55e" suffix="元" />
        <StatCard title="热门菜品点击率" value={stats.popularItemClicks} color="#f97316" suffix="%" />
        <StatCard title="未完成订单" value={stats.pendingOrders} color="#ef4444" />
      </div>
    </div>
  );
}
