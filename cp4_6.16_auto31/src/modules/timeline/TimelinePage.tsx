import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  eachDayOfInterval,
  format,
  startOfMonth,
  endOfMonth,
  parseISO,
  isToday,
} from 'date-fns';
import { useHabitStore, Habit } from '../../store';

interface ColorThreshold {
  days: number;
  color: string;
}

const COLOR_THRESHOLDS: ColorThreshold[] = [
  { days: 0, color: 'rgba(255,255,255,0.2)' },
  { days: 7, color: '#cd7f32' },
  { days: 14, color: '#c0c0c0' },
  { days: 30, color: '#ffd700' },
];

const parseColor = (color: string): { r: number; g: number; b: number; a: number } => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
  }
  return { r: 255, g: 255, b: 255, a: 1 };
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const getGradientColor = (streakDays: number): string => {
  if (streakDays <= COLOR_THRESHOLDS[0].days) return COLOR_THRESHOLDS[0].color;
  if (streakDays >= COLOR_THRESHOLDS[COLOR_THRESHOLDS.length - 1].days) {
    return COLOR_THRESHOLDS[COLOR_THRESHOLDS.length - 1].color;
  }

  for (let i = 0; i < COLOR_THRESHOLDS.length - 1; i++) {
    const lower = COLOR_THRESHOLDS[i];
    const upper = COLOR_THRESHOLDS[i + 1];
    if (streakDays >= lower.days && streakDays <= upper.days) {
      const t = (streakDays - lower.days) / (upper.days - lower.days);
      const c1 = parseColor(lower.color);
      const c2 = parseColor(upper.color);
      const r = Math.round(lerp(c1.r, c2.r, t));
      const g = Math.round(lerp(c1.g, c2.g, t));
      const b = Math.round(lerp(c1.b, c2.b, t));
      const a = lerp(c1.a, c2.a, t);
      if (a < 1) {
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
      }
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  return COLOR_THRESHOLDS[COLOR_THRESHOLDS.length - 1].color;
};

interface DayData {
  date: Date;
  dateStr: string;
  habitIds: string[];
  firstHabitEmoji: string | null;
  streakFromStart: number;
}

interface MonthData {
  month: Date;
  monthStr: string;
  days: DayData[];
  completionRate: number;
}

const RingChart: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({
  percentage,
  size = 80,
  strokeWidth = 8,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#ffd700"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: 'stroke-dashoffset 0.5s ease-out',
          filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))',
        }}
      />
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="bold"
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  );
};

const DayDetailPopup: React.FC<{
  day: DayData;
  habits: Habit[];
  position: { x: number; y: number };
  onClose: () => void;
}> = ({ day, habits, position, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-12px',
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '200px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>
          {format(day.date, 'yyyy年MM月dd日')}
        </p>
        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
          完成 {day.habitIds.length} / {habits.length} 个习惯
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {habits.map((habit) => {
          const isCompleted = day.habitIds.includes(habit.id);
          return (
            <div
              key={habit.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isCompleted ? 1 : 0.5,
              }}
            >
              <span style={{ fontSize: '18px' }}>{habit.emoji}</span>
              <span style={{ fontSize: '14px', flex: 1 }}>{habit.name}</span>
              <span style={{ fontSize: '16px' }}>{isCompleted ? '✓' : '○'}</span>
            </div>
          );
        })}
      </div>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </div>
  );
};

const TimelineNode: React.FC<{
  day: DayData;
  isFirst: boolean;
  isLast: boolean;
  streakColor: string;
  onClick: (e: React.MouseEvent) => void;
  nodeSize: number;
  gap: number;
}> = ({ day, isFirst, isLast, streakColor, onClick, nodeSize, gap }) => {
  const hasCheckin = day.habitIds.length > 0;
  const lineWidth = gap - nodeSize;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {!isFirst && (
        <div
          style={{
            width: `${lineWidth}px`,
            height: '3px',
            background: hasCheckin ? streakColor : 'rgba(255, 255, 255, 0.15)',
            borderRadius: '2px',
            transition: 'background 0.3s ease',
          }}
        />
      )}
      <div
        onClick={onClick}
        style={{
          width: `${nodeSize}px`,
          height: `${nodeSize}px`,
          borderRadius: '50%',
          background: hasCheckin
            ? `radial-gradient(circle at 30% 30%, ${streakColor}, ${streakColor}88)`
            : 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${nodeSize * 0.5}px`,
          cursor: 'pointer',
          boxShadow: hasCheckin
            ? `0 0 ${nodeSize / 3}px ${streakColor}66`
            : 'none',
          border: isToday(day.date) ? '2px solid #e94560' : 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.2)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
        }}
      >
        {day.firstHabitEmoji || ''}
      </div>
      {!isLast && (
        <div
          style={{
            width: `${lineWidth}px`,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '2px',
          }}
        />
      )}
    </div>
  );
};

const MonthGroup: React.FC<{
  monthData: MonthData;
  onDayClick: (day: DayData, e: React.MouseEvent) => void;
  nodeSize: number;
  gap: number;
}> = ({ monthData, onDayClick, nodeSize, gap }) => {
  const [showRing, setShowRing] = useState(false);

  const getStreakColor = (streak: number): string => {
    if (streak >= 30) return '#ffd700';
    if (streak >= 14) return '#c0c0c0';
    if (streak >= 7) return '#cd7f32';
    return 'rgba(255, 255, 255, 0.6)';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginRight: '24px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          marginBottom: '12px',
        }}
        onMouseEnter={() => setShowRing(true)}
        onMouseLeave={() => setShowRing(false)}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          {format(monthData.month, 'yyyy年 MM月')}
        </p>
        {showRing && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              zIndex: 50,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <RingChart percentage={monthData.completionRate} />
            <p
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '8px',
              }}
            >
              月完成率
            </p>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {monthData.days.map((day, index) => (
          <TimelineNode
            key={day.dateStr}
            day={day}
            isFirst={index === 0}
            isLast={index === monthData.days.length - 1}
            streakColor={getStreakColor(day.streakFromStart)}
            onClick={(e) => onDayClick(day, e)}
            nodeSize={nodeSize}
            gap={gap}
          />
        ))}
      </div>
    </div>
  );
};

const TimelinePage: React.FC = () => {
  const { checkins, habits, badges } = useHabitStore();
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const nodeSize = isMobile ? 28 : 36;
  const gap = isMobile ? 36 : 48;

  const timelineData = useMemo(() => {
    const allDates = Object.keys(checkins);
    if (allDates.length === 0) return [];

    const earliestDate = allDates.reduce((earliest, dateStr) => {
      const date = parseISO(dateStr);
      return date < parseISO(earliest) ? dateStr : earliest;
    });

    const startDate = parseISO(earliestDate);
    const endDate = new Date();
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    let runningStreak = 0;

    const daysWithData: DayData[] = allDays.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const habitIds = checkins[dateStr] || [];
      const firstHabit = habits.find((h) => habitIds.includes(h.id));

      if (habitIds.length > 0) {
        runningStreak++;
      } else {
        runningStreak = 0;
      }

      return {
        date,
        dateStr,
        habitIds,
        firstHabitEmoji: firstHabit ? firstHabit.emoji : null,
        streakFromStart: runningStreak,
      };
    });

    const monthGroups: Record<string, DayData[]> = {};
    daysWithData.forEach((day) => {
      const monthKey = format(day.date, 'yyyy-MM');
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(day);
    });

    const result: MonthData[] = Object.entries(monthGroups).map(([monthStr, days]) => {
      const monthDate = parseISO(monthStr + '-01');
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const totalPossibleCheckins = daysInMonth.length * habits.length;
      const totalCheckins = days.reduce((sum, day) => sum + day.habitIds.length, 0);
      const completionRate =
        totalPossibleCheckins > 0 ? (totalCheckins / totalPossibleCheckins) * 100 : 0;

      return {
        month: monthDate,
        monthStr,
        days,
        completionRate,
      };
    });

    return result;
  }, [checkins, habits]);

  const handleDayClick = (day: DayData, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setSelectedDay(day);
  };

  const handleClosePopup = () => {
    setSelectedDay(null);
  };

  useEffect(() => {
    const handleClick = () => {
      if (selectedDay) {
        handleClosePopup();
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [selectedDay]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [timelineData]);

  const totalBadges = badges.length;
  const totalCheckins = Object.values(checkins).reduce((sum, ids) => sum + ids.length, 0);

  return (
    <div
      style={{
        padding: isMobile ? '16px' : '24px',
        minHeight: '100vh',
      }}
      onClick={handleClosePopup}
    >
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 'bold',
            marginBottom: '8px',
          }}
        >
          时间线
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
          追踪你的习惯之旅，见证每一步成长
        </p>
      </div>

      <div
        className="glass"
        style={{
          padding: isMobile ? '16px' : '20px',
          marginBottom: '24px',
          display: 'flex',
          gap: isMobile ? '16px' : '32px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
            总打卡次数
          </p>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalCheckins}</p>
        </div>
        <div>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
            获得徽章
          </p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffd700' }}>{totalBadges}</p>
        </div>
        <div>
          <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
            习惯数量
          </p>
          <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{habits.length}</p>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '20px 0',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            padding: '40px 20px',
            minWidth: 'fit-content',
          }}
        >
          {timelineData.length === 0 ? (
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                padding: '60px 20px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📅</p>
              <p style={{ fontSize: '16px' }}>还没有打卡记录</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>开始你的第一个习惯打卡吧！</p>
            </div>
          ) : (
            timelineData.map((monthData) => (
              <MonthGroup
                key={monthData.monthStr}
                monthData={monthData}
                onDayClick={handleDayClick}
                nodeSize={nodeSize}
                gap={gap}
              />
            ))
          )}
        </div>
      </div>

      {selectedDay && (
        <DayDetailPopup
          day={selectedDay}
          habits={habits}
          position={popupPosition}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default TimelinePage;
