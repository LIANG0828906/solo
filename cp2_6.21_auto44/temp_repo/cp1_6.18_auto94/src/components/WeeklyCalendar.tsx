import { useState, useEffect } from 'react';
import { useGardenStore } from '../garden/gardenStore';
import { format, eachDayOfInterval, startOfDay, isSameDay, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface WeeklyCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklyCalendar({ isOpen, onClose }: WeeklyCalendarProps) {
  const zones = useGardenStore((state) => state.zones);
  const wateringLogs = useGardenStore((state) => state.wateringLogs);
  const calculateWeeklyCompletionRate = useGardenStore((state) => state.calculateWeeklyCompletionRate);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const today = startOfDay(new Date());
  const weekDays = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  });

  const hasWateredOnDay = (zoneId: string, day: Date) => {
    return wateringLogs.some(
      (log) => log.zoneId === zoneId && isSameDay(log.timestamp, day)
    );
  };

  const getWeekDayLabel = (date: Date, index: number) => {
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    if (index === 6) return '今天';
    return dayNames[date.getDay()];
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: isOpen ? (isMobile ? '100%' : '400px') : '0',
        backgroundColor: '#16213E',
        boxShadow: isOpen ? '-4px 0 16px rgba(0,0,0,0.3)' : 'none',
        transition: 'width 0.3s ease-in-out',
        overflow: 'hidden',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: 0 }}>
          📅 周历视图
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0 8px',
            opacity: 0.7,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
            最近七天浇水记录
          </div>

          {zones.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '14px',
              }}
            >
              暂无花园区域
            </div>
          ) : (
            zones.map((zone) => {
              const completionRate = calculateWeeklyCompletionRate(zone.id);
              const percentage = Math.round(completionRate * 100);

              return (
                <div
                  key={zone.id}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>
                      {zone.name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      完成率 {percentage}%
                    </span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '3px',
                      marginBottom: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: '#4ECDC4',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease-out',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {weekDays.map((day, index) => {
                      const watered = hasWateredOnDay(zone.id, day);
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {getWeekDayLabel(day, index)}
                          </span>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: watered
                                ? 'rgba(52, 152, 219, 0.3)'
                                : 'rgba(255,255,255,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                            }}
                          >
                            {watered ? '💧' : '•'}
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              color: 'rgba(255,255,255,0.4)',
                            }}
                          >
                            {format(day, 'MM/dd')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'white', marginBottom: '10px' }}>
            📊 统计概览
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ECDC4' }}>
                {zones.length}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                花园区域
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFE66D' }}>
                {wateringLogs.filter((log) => log.timestamp >= subDays(new Date(), 7).getTime()).length}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                本周浇水次数
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
