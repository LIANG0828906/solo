import React, { useState, useEffect } from 'react';
import {
  startOfWeek, endOfWeek, addDays, format, differenceInDays,
  parseISO, isSameWeek, isAfter, isBefore, startOfDay
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PersonalKR {
  id: string;
  name: string;
  description: string;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  objectiveId: string;
  objectiveName: string;
  cycleId: string;
  cycleName: string;
  owner: string;
}

interface Props {
  currentMember: string;
}

const getProgressColorByDays = (days: number): string => {
  if (days >= 7) return '#00C853';
  if (days >= 3) return '#FFD600';
  return '#FF5252';
};

const WeekCalendar: React.FC<{ keyResults: PersonalKR[] }> = ({ keyResults }) => {
  const today = new Date();
  const weeks: Date[] = [];
  let currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

  for (let i = 0; i < 8; i++) {
    weeks.push(addDays(currentWeekStart, i * 7));
  }

  const getDotsForWeek = (weekStart: Date): { color: string }[] => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const dots: { color: string }[] = [];

    keyResults.forEach(kr => {
      const deadline = parseISO(kr.deadline);
      if (!isBefore(deadline, startOfDay(weekStart)) && !isAfter(deadline, weekEnd)) {
        const daysLeft = differenceInDays(deadline, today);
        dots.push({ color: getProgressColorByDays(daysLeft) });
      }
    });

    return dots.slice(0, 4);
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      padding: '20px 16px',
      boxShadow: '0 2px 12px rgba(108, 99, 255, 0.06)',
      marginBottom: 24,
    }}>
      <div style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#2D2B55',
        marginBottom: 16,
        paddingLeft: 4,
      }}>
        未来周计划
      </div>
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
        scrollBehavior: 'smooth',
      }}>
        {weeks.map((weekStart, idx) => {
          const isCurrentWeek = isSameWeek(today, weekStart, { weekStartsOn: 1 });
          const dots = getDotsForWeek(weekStart);
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

          return (
            <div
              key={idx}
              style={{
                flex: '0 0 auto',
                width: 90,
                padding: '14px 10px',
                borderRadius: 10,
                background: isCurrentWeek
                  ? 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(245,0,87,0.08))'
                  : '#FAFAFF',
                border: isCurrentWeek ? '1.5px solid #6C63FF' : '1px solid transparent',
                textAlign: 'center',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <div style={{
                fontSize: 11,
                color: isCurrentWeek ? '#6C63FF' : '#8B88B5',
                fontWeight: 600,
                marginBottom: 4,
              }}>
                第 {Math.ceil((weekStart.getDate() + startOfWeek(new Date(weekStart.getFullYear(), weekStart.getMonth(), 1), { weekStartsOn: 1 }).getDate()) / 7)} 周
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#2D2B55',
                marginBottom: 2,
              }}>
                {format(weekStart, 'MM/dd', { locale: zhCN })}
              </div>
              <div style={{
                fontSize: 10,
                color: '#8B88B5',
                marginBottom: 8,
              }}>
                - {format(weekEnd, 'dd')}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
                minHeight: 8,
              }}>
                {dots.map((dot, i) => (
                  <div
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: dot.color,
                      boxShadow: `0 0 4px ${dot.color}50`,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UpdateDialog: React.FC<{
  kr: PersonalKR | null;
  onClose: () => void;
  onSave: (value: number) => void;
}> = ({ kr, onClose, onSave }) => {
  const [value, setValue] = useState<string>('');

  useEffect(() => {
    if (kr) {
      setValue(String(kr.currentValue));
    }
  }, [kr]);

  if (!kr) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(45, 43, 85, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        animation: 'fadeInUp 0.2s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 28,
          width: 400,
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(108, 99, 255, 0.25)',
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#2D2B55',
          marginBottom: 8,
        }}>
          更新关键结果
        </h3>
        <p style={{
          fontSize: 13,
          color: '#8B88B5',
          marginBottom: 20,
          lineHeight: 1.5,
        }}>
          {kr.description}
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{
            fontSize: 12,
            color: '#6B6891',
            fontWeight: 500,
            display: 'block',
            marginBottom: 8,
          }}>
            当前值 ({kr.unit})
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                border: '2px solid #E8E6FF',
                fontSize: 16,
                outline: 'none',
                transition: 'border-color 0.3s ease-in-out',
                color: '#2D2B55',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E8E6FF'; }}
            />
            <span style={{ color: '#8B88B5', fontSize: 14 }}>/ {kr.targetValue}</span>
          </div>
          <div style={{
            fontSize: 11,
            color: '#8B88B5',
            marginTop: 8,
          }}>
            初始值: {kr.initialValue} · 目标值: {kr.targetValue}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#F0EEFF',
              color: '#6C63FF',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            取消
          </button>
          <button
            onClick={() => {
              const num = parseFloat(value);
              if (!isNaN(num)) {
                onSave(num);
              }
            }}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #6C63FF, #8B82FF)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease-in-out',
              boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)',
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

const PaperPlane: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 60,
        bottom: 100,
        fontSize: 22,
        zIndex: 2000,
        animation: 'paperPlane 0.8s ease-out forwards',
        pointerEvents: 'none',
      }}
    >
      ✈️
    </div>
  );
};

const PersonalView: React.FC<Props> = ({ currentMember }) => {
  const [keyResults, setKeyResults] = useState<PersonalKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKR, setSelectedKR] = useState<PersonalKR | null>(null);
  const [showPlane, setShowPlane] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchKRs = async () => {
      try {
        const res = await fetch(`/api/members/${encodeURIComponent(currentMember)}/keyresults`);
        const data = await res.json();
        setKeyResults(data);
      } catch (e) {
        console.error('Failed to fetch personal KRs', e);
      } finally {
        setLoading(false);
      }
    };
    fetchKRs();
  }, [currentMember, refreshKey]);

  const handleSave = async (newValue: number) => {
    if (!selectedKR) return;

    try {
      await fetch(
        `/api/cycles/${selectedKR.cycleId}/objectives/${selectedKR.objectiveId}/keyresults/${selectedKR.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentValue: newValue }),
        }
      );

      setSelectedKR(null);
      setShowPlane(true);
      setTimeout(() => setShowPlane(false), 800);
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error('Failed to update KR', e);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        color: '#6C63FF',
        fontSize: 16,
      }}>
        加载中...
      </div>
    );
  }

  const sortedKRs = [...keyResults].sort((a, b) =>
    differenceInDays(parseISO(a.deadline), parseISO(b.deadline))
  );

  return (
    <div style={{ padding: '24px 32px 40px', position: 'relative', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#2D2B55',
          marginBottom: 4,
        }}>
          我的 OKR
        </h1>
        <p style={{ fontSize: 14, color: '#8B88B5' }}>
          {currentMember} · 共 {keyResults.length} 个关键结果待推进
        </p>
      </div>

      <WeekCalendar keyResults={keyResults} />

      <div style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(108, 99, 255, 0.06)',
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #F0EEFF',
          display: 'grid',
          gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
          gap: 16,
          fontSize: 12,
          fontWeight: 600,
          color: '#8B88B5',
        }}>
          <div>关键结果</div>
          <div>关联目标</div>
          <div>当前进度</div>
          <div>截止日期</div>
          <div style={{ width: 20 }}></div>
        </div>

        <div>
          {sortedKRs.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center', color: '#8B88B5', fontSize: 14 }}>
              暂无分配给你的关键结果
            </div>
          ) : (
            sortedKRs.map((kr, idx) => {
              const daysLeft = differenceInDays(parseISO(kr.deadline), new Date());
              const progress = Math.max(0, Math.min(100,
                ((kr.currentValue - kr.initialValue) / (kr.targetValue - kr.initialValue)) * 100
              ));
              const clampedProgress = isNaN(progress) ? 0 : progress;
              const progressColor = getProgressColorByDays(daysLeft);

              return (
                <div
                  key={kr.id}
                  style={{
                    padding: '16px 24px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
                    gap: 16,
                    alignItems: 'center',
                    borderBottom: '1px solid #F5F4FF',
                    transition: 'background 0.2s ease-in-out',
                    opacity: 0,
                    animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s forwards`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFF'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#2D2B55', marginBottom: 4 }}>
                      {kr.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#8B88B5' }}>
                      {kr.currentValue} / {kr.targetValue} {kr.unit}
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: '#6C63FF' }}>
                    {kr.objectiveName}
                  </div>

                  <div>
                    <div style={{
                      height: 6,
                      background: '#E8E6FF',
                      borderRadius: 3,
                      overflow: 'hidden',
                      marginBottom: 4,
                      width: '100%',
                      maxWidth: 120,
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${clampedProgress}%`,
                          background: progressColor,
                          borderRadius: 3,
                          transition: 'width 0.5s ease-in-out, background 0.3s ease-in-out',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#8B88B5' }}>
                      {Math.round(clampedProgress)}%
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: '#2D2B55' }}>
                      {format(parseISO(kr.deadline), 'yyyy/MM/dd')}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: daysLeft < 0 ? '#FF5252' : '#8B88B5',
                      fontWeight: daysLeft <= 2 ? 600 : 400,
                    }}>
                      {daysLeft < 0 ? `已逾期 ${-daysLeft} 天` :
                        daysLeft === 0 ? '今天截止' :
                          `剩余 ${daysLeft} 天`}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedKR(kr)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      background: '#F0EEFF',
                      color: '#6C63FF',
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#6C63FF';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F0EEFF';
                      e.currentTarget.style.color = '#6C63FF';
                    }}
                  >
                    ✎
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <button
        onClick={() => sortedKRs.length > 0 && setSelectedKR(sortedKRs[0])}
        style={{
          position: 'fixed',
          right: 32,
          bottom: 40,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #6C63FF, #F50057)',
          color: '#fff',
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(108, 99, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease-in-out',
          zIndex: 100,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ✎
      </button>

      <UpdateDialog
        kr={selectedKR}
        onClose={() => setSelectedKR(null)}
        onSave={handleSave}
      />

      <PaperPlane show={showPlane} />
    </div>
  );
};

export default PersonalView;
