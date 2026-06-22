import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGraphStore } from '../store/graphStore';
import { calculateStats } from './dashboardStats';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1.5,
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easedProgress = easeOut(progress);
      setDisplayValue(value * easedProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue.toFixed(decimals)}</span>;
};

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  decimals?: number;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, decimals = 0, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: '#8A8AA0',
          marginBottom: '8px',
          letterSpacing: '0.3px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 600,
          color: '#FFFFFF',
          lineHeight: 1.2,
        }}
      >
        <AnimatedNumber value={value} decimals={decimals} />
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: '11px',
            color: '#6A6A7E',
            marginTop: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={subtitle}
        >
          {subtitle}
        </div>
      )}
    </motion.div>
  );
};

const DashboardUI: React.FC = () => {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const filterKeyword = useGraphStore((s) => s.filterKeyword);
  const setFilterKeyword = useGraphStore((s) => s.setFilterKeyword);
  const error = useGraphStore((s) => s.error);
  const setError = useGraphStore((s) => s.setError);

  const stats = calculateStats(nodes, edges);

  const cards = [
    { title: '节点总数', value: stats.nodeCount, decimals: 0 },
    { title: '连接总数', value: stats.edgeCount, decimals: 0 },
    { title: '平均度数', value: stats.averageDegree, decimals: 2 },
    {
      title: '最大中心度',
      value: stats.maxCentrality,
      decimals: 2,
      subtitle: stats.maxCentralityNode ? `节点: ${stats.maxCentralityNode}` : undefined,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: 'rgba(255, 68, 102, 0.12)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '14px',
            color: '#FF6688',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '12px',
            flexShrink: 0,
          }}
        >
          <span style={{ lineHeight: 1.5 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FF6688',
              cursor: 'pointer',
              fontSize: '16px',
              lineHeight: 1,
              padding: '0 2px',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </motion.div>
      )}

      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <input
          type="text"
          placeholder="输入节点名称筛选..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            background: '#2A2A3A',
            color: '#FFFFFF',
            border: '1px solid transparent',
            outline: 'none',
            fontSize: '14px',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#00D4AA';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {cards.map((card, idx) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            decimals={card.decimals}
            delay={idx * 0.1}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardUI;
