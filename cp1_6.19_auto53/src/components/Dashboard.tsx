import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiCalendar, FiClock, FiAlertTriangle, FiDownload } from 'react-icons/fi';
import type { DashboardStats } from '@/types';
import { mockDataService } from '@/services/mockData';
import { ReservationList } from './ReservationList';

const AnimatedNumber: React.FC<{ value: number; suffix?: string; decimals?: number }> = ({
  value,
  suffix = '',
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
    prevValueRef.current = value;
  }, [value]);

  const formatted = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toLocaleString();

  return (
    <span
      style={{
        fontVariantNumeric: 'tabular-nums',
        display: 'inline-block',
      }}
    >
      {formatted}
      {suffix}
    </span>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  decimals?: number;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix,
  decimals,
  icon,
  gradient,
  iconBg,
}) => {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid var(--divider)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 50px rgba(124, 111, 247, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: gradient,
          opacity: 0.08,
          filter: 'blur(20px)',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: '#9B9BB0',
              fontSize: '13px',
              marginBottom: '10px',
              fontWeight: 500,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}
          >
            <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
          </div>
        </div>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            background: iconBg,
            color: '#fff',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    todayReservations: 0,
    overdueRate: 0,
  });
  const [, setRefreshKey] = useState(0);
  const forceRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const calculateStats = useCallback(() => {
    const reservations = mockDataService.getReservations();
    const today = new Date().toISOString().split('T')[0];
    const todayCount = reservations.filter((r) => r.date === today).length;
    const total = reservations.length;
    const overdueCount = reservations.filter((r) => r.status === 'overdue').length;
    const overdueRate = total > 0 ? (overdueCount / total) * 100 : 0;

    setStats({
      totalReservations: total,
      todayReservations: todayCount,
      overdueRate: Math.round(overdueRate * 10) / 10,
    });
  }, []);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const generateReport = () => {
    const reservations = mockDataService.getReservations();
    const games = mockDataService.getGames();
    const lines: string[] = [];
    lines.push('=== 社区棋盘预约使用报告 ===');
    lines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push('');
    lines.push('--- 统计概览 ---');
    lines.push(`总预约数: ${stats.totalReservations}`);
    lines.push(`今日预约: ${stats.todayReservations}`);
    lines.push(`超时率: ${stats.overdueRate}%`);
    lines.push('');
    lines.push('--- 热门游戏排行榜 ---');
    games.slice(0, 5).forEach((g, i) => {
      lines.push(`${i + 1}. ${g.name} - 热度 ${g.popularity} · 评分 ${g.avgRating}`);
    });
    lines.push('');
    lines.push('--- 预约明细 ---');
    reservations.forEach((r) => {
      lines.push(
        `[${r.date} ${r.startTime}-${r.endTime}] ${r.gameName} - ${r.userName} (${r.status})`
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `使用报告_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '12px',
              color: '#7C6FF7',
              fontWeight: 600,
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            管理员控制台
          </div>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #fff 0%, #9B9BB0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em',
            }}
          >
            预约管理面板
          </h1>
          <p style={{ color: '#6B6B85', marginTop: '8px', fontSize: '15px' }}>
            实时监控社区棋盘租赁情况，处理预约与生成报告
          </p>
        </div>
        <button
          onClick={generateReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 24px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #FF8C42, #F59E0B)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.2s ease-out',
            boxShadow: '0 8px 24px rgba(255, 140, 66, 0.35)',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 140, 66, 0.45)';
          }}
        >
          <FiDownload /> 生成使用报告
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
        }}
      >
        <StatCard
          title="总预约数"
          value={stats.totalReservations}
          icon={<FiCalendar />}
          gradient="linear-gradient(135deg, #7C6FF7, #6366F1)"
          iconBg="linear-gradient(135deg, #7C6FF7, #6366F1)"
        />
        <StatCard
          title="今日预约"
          value={stats.todayReservations}
          icon={<FiClock />}
          gradient="linear-gradient(135deg, #22C55E, #16A34A)"
          iconBg="linear-gradient(135deg, #22C55E, #16A34A)"
        />
        <StatCard
          title="超时率"
          value={stats.overdueRate}
          suffix="%"
          decimals={1}
          icon={<FiAlertTriangle />}
          gradient="linear-gradient(135deg, #F87171, #DC2626)"
          iconBg="linear-gradient(135deg, #F87171, #DC2626)"
        />
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--divider)',
          padding: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#fff',
              letterSpacing: '-0.02em',
            }}
          >
            📅 预约时间线
          </h2>
          <div
            style={{
              fontSize: '13px',
              color: '#6B6B85',
            }}
          >
            点击卡片查看详情，可标记归还/超时状态
          </div>
        </div>
        <ReservationList
          isAdmin
          onStatusChange={() => {
            forceRefresh();
            calculateStats();
          }}
        />
      </div>
    </div>
  );
};
