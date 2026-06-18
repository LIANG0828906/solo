import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useAppContext } from '../App';

interface ChallengeProps {
  isMobile: boolean;
}

const Challenge: React.FC<ChallengeProps> = ({ isMobile }) => {
  const { readingRecords, addReadingTime } = useAppContext();
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (seconds >= 60 && !savedRef.current) {
        const mins = Math.floor(seconds / 60);
        const today = new Date().getDate().toString();
        addReadingTime(today, mins);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [seconds, addReadingTime]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const displayTime = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const handleStartPause = () => {
    if (!isRunning) {
      savedRef.current = false;
    }
    setIsRunning(r => !r);
  };

  const handleReset = () => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60);
      const today = new Date().getDate().toString();
      addReadingTime(today, mins);
      savedRef.current = true;
    }
    setIsRunning(false);
    setSeconds(0);
  };

  const totalMinutes = useMemo(
    () => readingRecords.reduce((acc, r) => acc + r.minutes, 0) + Math.floor(seconds / 60),
    [readingRecords, seconds]
  );

  const todayStr = new Date().getDate().toString();
  const todayMinutes = useMemo(() => {
    const rec = readingRecords.find(r => r.date === todayStr);
    return (rec?.minutes || 0) + Math.floor(seconds / 60);
  }, [readingRecords, todayStr, seconds]);

  const currentMonth = new Date();
  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const chartData = useMemo(() => {
    return readingRecords.map(r => ({
      ...r,
      displayDate: r.date
    }));
  }, [readingRecords]);

  const avgMinutes = useMemo(() => {
    const today = currentMonth.getDate();
    return today > 0 ? Math.round(totalMinutes / today) : 0;
  }, [totalMinutes, currentMonth]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #E0E0E0',
            borderRadius: 8,
            padding: '8px 14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            fontSize: 13
          }}
        >
          <div style={{ color: '#666', marginBottom: 4 }}>
            {monthNames[currentMonth.getMonth()]} {label}日
          </div>
          <div style={{ color: '#2E7D32', fontWeight: 600 }}>
            {payload[0].value} 分钟
          </div>
        </div>
      );
    }
    return null;
  };

  const progressPercent = Math.min(100, Math.round((todayMinutes / 60) * 100));

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 32 }}
      >
        <h1
          style={{
            fontSize: isMobile ? 24 : 28,
            fontWeight: 700,
            color: '#263238',
            marginBottom: 8
          }}
        >
          阅读挑战
        </h1>
        <p style={{ fontSize: 14, color: '#666' }}>
          {monthNames[currentMonth.getMonth()]} · 目标每天阅读60分钟
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 12 : 16,
          marginBottom: 36
        }}
      >
        {[
          {
            label: '今日阅读',
            value: todayMinutes,
            unit: '分钟',
            color: '#4CAF50',
            bg: '#E8F5E9'
          },
          {
            label: '本月累计',
            value: totalMinutes,
            unit: '分钟',
            color: '#2196F3',
            bg: '#E3F2FD'
          },
          {
            label: '日均阅读',
            value: avgMinutes,
            unit: '分钟',
            color: '#FF9800',
            bg: '#FFF3E0'
          },
          {
            label: '今日进度',
            value: progressPercent,
            unit: '%',
            color: '#9C27B0',
            bg: '#F3E5F5'
          }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.08 + idx * 0.04 }}
            whileHover={{ y: -3 }}
            style={{
              backgroundColor: stat.bg,
              borderRadius: 12,
              padding: isMobile ? 14 : 18,
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: stat.color,
                marginBottom: 6,
                fontWeight: 500,
                opacity: 0.85
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 4
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 24 : 28,
                  fontWeight: 700,
                  color: stat.color
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: stat.color,
                  opacity: 0.75,
                  fontWeight: 500
                }}
              >
                {stat.unit}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 40
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <motion.div
            animate={{
              boxShadow: isRunning
                ? [
                    '0 0 0 0 rgba(76, 175, 80, 0.4)',
                    '0 0 0 16px rgba(76, 175, 80, 0)',
                    '0 0 0 0 rgba(76, 175, 80, 0)'
                  ]
                : 'none'
            }}
            transition={{
              duration: 2,
              repeat: isRunning ? Infinity : 0,
              ease: 'easeOut'
            }}
            style={{
              width: 200,
              height: 200,
              border: '2px solid #4CAF50',
              backgroundColor: '#ECEFF1',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              position: 'relative'
            }}
          >
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#E0E0E0"
                strokeWidth="6"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#4CAF50"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 90}
                strokeDashoffset={2 * Math.PI * 90 * (1 - progressPercent / 100)}
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#263238',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: 2,
                zIndex: 1
              }}
            >
              {displayTime}
            </div>
          </motion.div>

          <div style={{ display: 'flex', gap: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartPause}
              style={{
                padding: '12px 28px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#4CAF50',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                minWidth: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              {isRunning ? '⏸ 暂停' : '▶ 开始'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              style={{
                padding: '12px 28px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#4CAF50',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                minWidth: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              ↺ 重置
            </motion.button>
          </div>
          {seconds >= 60 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 14,
                fontSize: 12,
                color: '#888'
              }}
            >
              💡 重置时会将本次阅读时间计入统计
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 18,
            gap: 12
          }}
        >
          <div
            style={{
              width: 4,
              height: 22,
              backgroundColor: '#4CAF50',
              borderRadius: 2
            }}
          />
          <h2
            style={{
              fontSize: isMobile ? 18 : 20,
              fontWeight: 700,
              color: '#263238'
            }}
          >
            {monthNames[currentMonth.getMonth()]}阅读统计
          </h2>
          <span
            style={{
              fontSize: 13,
              color: '#888',
              backgroundColor: '#EEEEEE',
              padding: '3px 10px',
              borderRadius: 12
            }}
          >
            共 {totalMinutes} 分钟
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: isMobile ? 16 : 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            height: isMobile ? 280 : 340
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 10,
                right: isMobile ? 5 : 20,
                left: isMobile ? -10 : 0,
                bottom: 5
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#F0F0F0"
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#888' }}
                axisLine={{ stroke: '#E0E0E0' }}
                tickLine={false}
                interval={isMobile ? 3 : 1}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                unit="分"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(76, 175, 80, 0.06)' }} />
              <Bar
                dataKey="minutes"
                radius={[4, 4, 0, 0]}
                barSize={isMobile ? 8 : 12}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#colorGradient)`}
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#81C784" />
                  <stop offset="100%" stopColor="#388E3C" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

export default Challenge;
