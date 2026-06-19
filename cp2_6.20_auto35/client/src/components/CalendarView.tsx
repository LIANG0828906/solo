import React, { useState, useMemo } from 'react';
import { MoodData, MOOD_CONFIGS } from '../types';
import MoodCard from './MoodCard';

interface CalendarViewProps {
  moods?: MoodData[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ moods = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days = useMemo(() => {
    const result: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      result.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      result.push(i);
    }
    return result;
  }, [startDay, daysInMonth]);

  const getMoodsForDate = (dateStr: string) => {
    return moods.filter((m) => m.timestamp.startsWith(dateStr));
  };

  const getAvgColorForDate = (dateStr: string) => {
    const dayMoods = getMoodsForDate(dateStr);
    if (dayMoods.length === 0) return '#e0e0e0';
    const totalIntensity = dayMoods.reduce((sum, m) => sum + m.intensity, 0);
    const weightedHue = dayMoods.reduce(
      (sum, m) => sum + MOOD_CONFIGS[m.type].hue * m.intensity,
      0
    );
    const avgHue = weightedHue / totalIntensity;
    return `hsl(${avgHue}, 70%, 60%)`;
  };

  const stats = useMemo(() => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthMoods = moods.filter((m) => m.timestamp.startsWith(monthStr));
    const uniqueDays = new Set(monthMoods.map((m) => m.timestamp.slice(0, 10)));

    let maxIntensity = 0;
    let maxMoodType = 'calm';
    let totalIntensity = 0;

    monthMoods.forEach((m) => {
      totalIntensity += m.intensity;
      if (m.intensity > maxIntensity) {
        maxIntensity = m.intensity;
        maxMoodType = m.type;
      }
    });

    return {
      recordDays: uniqueDays.size,
      maxIntensity,
      maxMoodLabel: MOOD_CONFIGS[maxMoodType as keyof typeof MOOD_CONFIGS].label,
      maxMoodColor: MOOD_CONFIGS[maxMoodType as keyof typeof MOOD_CONFIGS].color,
      avgIntensity: monthMoods.length > 0 ? (totalIntensity / monthMoods.length).toFixed(1) : '0',
    };
  }, [moods, year, month]);

  const navigateMonth = (direction: number) => {
    setSlideDirection(direction > 0 ? 'right' : 'left');
    setTimeout(() => {
      setCurrentDate(new Date(year, month + direction, 1));
      setSlideDirection(null);
    }, 150);
  };

  const selectedDateMoods = selectedDate ? getMoodsForDate(selectedDate) : [];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            animation: 'slideInUp 0.5s ease 0.1s both',
          }}
        >
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>本月记录天数</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#667eea' }}>
            {stats.recordDays}
            <span style={{ fontSize: '14px', color: '#999', marginLeft: '4px' }}>天</span>
          </div>
        </div>
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            animation: 'slideInUp 0.5s ease 0.2s both',
          }}
        >
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>最高强度情绪</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: stats.maxMoodColor,
              }}
            />
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#333' }}>
              {stats.maxMoodLabel}
            </span>
            <span style={{ fontSize: '20px', color: stats.maxMoodColor, fontWeight: 600 }}>
              {stats.maxIntensity}
            </span>
          </div>
        </div>
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            animation: 'slideInUp 0.5s ease 0.3s both',
          }}
        >
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>平均强度</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#764ba2' }}>
            {stats.avgIntensity}
            <span style={{ fontSize: '14px', color: '#999', marginLeft: '4px' }}>/10</span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
          animation: 'slideInUp 0.5s ease 0.4s both',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            transform: slideDirection === 'left' ? 'translateX(-20px)' : slideDirection === 'right' ? 'translateX(20px)' : 'translateX(0)',
            opacity: slideDirection ? 0 : 1,
            transition: 'all 0.3s ease',
          }}
        >
          <button
            onClick={() => navigateMonth(-1)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.color = 'inherit';
            }}
          >
            ◀
          </button>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#333', margin: 0 }}>
            {year}年{month + 1}月
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#667eea';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.color = 'inherit';
            }}
          >
            ▶
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <div
              key={day}
              style={{
                textAlign: 'center',
                fontSize: '13px',
                color: '#999',
                padding: '8px',
                fontWeight: 500,
              }}
            >
              {day}
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            transform: slideDirection === 'left' ? 'translateX(-20px)' : slideDirection === 'right' ? 'translateX(20px)' : 'translateX(0)',
            opacity: slideDirection ? 0 : 1,
            transition: 'all 0.3s ease',
          }}
        >
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayMoods = getMoodsForDate(dateStr);
            const avgColor = getAvgColorForDate(dateStr);
            const isToday = dateStr === new Date().toISOString().slice(0, 10);

            return (
              <div
                key={day}
                onClick={() => dayMoods.length > 0 && setSelectedDate(dateStr)}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  background: isToday ? `${avgColor}15` : dayMoods.length > 0 ? '#fafafa' : 'transparent',
                  border: isToday ? `2px solid ${avgColor}` : '2px solid transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: dayMoods.length > 0 ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (dayMoods.length > 0) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = `${avgColor}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = isToday ? `${avgColor}15` : dayMoods.length > 0 ? '#fafafa' : 'transparent';
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? avgColor : '#333',
                  }}
                >
                  {day}
                </span>
                {dayMoods.length > 0 && (
                  <div style={{ display: 'flex', gap: '2px', marginTop: '4px' }}>
                    {dayMoods.slice(0, 3).map((mood, i) => (
                      <div
                        key={i}
                        style={{
                          width: `${mood.intensity * 3}px`,
                          height: `${mood.intensity * 3}px`,
                          borderRadius: '50%',
                          background: `hsl(${MOOD_CONFIGS[mood.type].hue}, 70%, 60%)`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <>
          <div
            onClick={() => setSelectedDate(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              animation: 'fadeIn 0.3s ease',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'white',
              borderRadius: '24px',
              padding: '32px',
              zIndex: 1001,
              animation: 'fadeIn 0.3s ease, slideInUp 0.4s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#333', margin: 0 }}>
                {new Date(selectedDate).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: '#f5f5f5',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ff6b6b';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.color = 'inherit';
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedDateMoods.length > 0 ? (
                selectedDateMoods.map((mood) => (
                  <MoodCard key={mood.id} moodData={mood} />
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  当天暂无记录
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarView;
