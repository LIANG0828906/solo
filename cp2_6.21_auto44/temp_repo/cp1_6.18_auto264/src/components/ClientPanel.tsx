import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TrainingPlan, ExerciseLog, Exercise } from '../types';

const CELEBRATE_MESSAGES = [
  '干得漂亮！肌肉在生长 💪',
  '棒极了！今天的你超努力 🔥',
  '继续保持，进步肉眼可见 ⭐',
  '完美！汗水不会骗人 💧',
  '太厉害了，你就是健身达人 🏆'
];

const getTodayStr = () => new Date().toISOString().split('T')[0];

const ClientPanel = () => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState('');
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('学员1');
  const [exerciseLogs, setExerciseLogs] = useState<Map<string, ExerciseLog>>(new Map());
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [celebrateMsg, setCelebrateMsg] = useState('');
  const [celebratePhase, setCelebratePhase] = useState<'enter' | 'exit' | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebratedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 140;
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  useEffect(() => {
    const updateViewport = () => {
      if (scrollContainerRef.current) {
        setViewportHeight(scrollContainerRef.current.clientHeight);
      }
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (plan) {
      const storageKey = `fitflow_logs_${plan.id}_${studentName}_${getTodayStr()}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const arr = JSON.parse(saved) as ExerciseLog[];
          const map = new Map<string, ExerciseLog>();
          arr.forEach((l) => map.set(l.exerciseId, l));
          setExerciseLogs(map);
        } catch {
          initDefaultLogs();
        }
      } else {
        initDefaultLogs();
      }
    }
    function initDefaultLogs() {
      if (!plan) return;
      const map = new Map<string, ExerciseLog>();
      plan.exercises.forEach((ex) => {
        map.set(ex.id, { exerciseId: ex.id, actualSets: 0, completed: false });
      });
      setExerciseLogs(map);
    }
  }, [plan, studentName]);

  const saveLogsToServer = useCallback(() => {
    if (!plan) return;
    const logs = Array.from(exerciseLogs.values());
    fetch('/api/logs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        studentName,
        date: getTodayStr(),
        exerciseLogs: logs
      })
    }).catch(() => {});
  }, [plan, studentName, exerciseLogs]);

  useEffect(() => {
    if (!plan) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const storageKey = `fitflow_logs_${plan.id}_${studentName}_${getTodayStr()}`;
      localStorage.setItem(storageKey, JSON.stringify(Array.from(exerciseLogs.values())));
      saveLogsToServer();
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [exerciseLogs, plan, studentName, saveLogsToServer]);

  useEffect(() => {
    if (!plan || celebratedRef.current) return;
    const allDone = plan.exercises.every((ex) => {
      const log = exerciseLogs.get(ex.id);
      return log && log.completed && log.actualSets >= ex.sets;
    });
    if (allDone && plan.exercises.length > 0) {
      celebratedRef.current = true;
      const msg = CELEBRATE_MESSAGES[Math.floor(Math.random() * CELEBRATE_MESSAGES.length)];
      setCelebrateMsg(msg);
      setCelebratePhase('enter');
      setShowCelebrate(true);
      setTimeout(() => {
        setCelebratePhase('exit');
        setTimeout(() => {
          setShowCelebrate(false);
          setCelebratePhase(null);
        }, 300);
      }, 2000);
    }
  }, [exerciseLogs, plan]);

  const handleFetchPlan = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/plans/${inviteCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (res.ok) {
        setPlan(data);
        celebratedRef.current = false;
      } else {
        setError(data.error || '获取计划失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = (exerciseId: string) => {
    setExerciseLogs((prev) => {
      const next = new Map(prev);
      const existing = next.get(exerciseId);
      const ex = plan?.exercises.find((e) => e.id === exerciseId);
      if (existing) {
        next.set(exerciseId, {
          ...existing,
          completed: !existing.completed,
          actualSets: !existing.completed && ex ? ex.sets : existing.actualSets
        });
      }
      return next;
    });
  };

  const updateActualSets = (exerciseId: string, value: number) => {
    setExerciseLogs((prev) => {
      const next = new Map(prev);
      const existing = next.get(exerciseId);
      if (existing) {
        next.set(exerciseId, {
          ...existing,
          actualSets: Math.max(0, value)
        });
      }
      return next;
    });
  };

  const { startIndex, endIndex, totalHeight, items } = useMemo<{
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    items: Exercise[];
  }>(() => {
    if (!plan) return { startIndex: 0, endIndex: 0, totalHeight: 0, items: [] as Exercise[] };
    const buffer = 50;
    const startIdx = Math.max(0, Math.floor((scrollTop - buffer) / itemHeight));
    const endIdx = Math.min(
      plan.exercises.length,
      Math.ceil((scrollTop + viewportHeight + buffer) / itemHeight)
    );
    return {
      startIndex: startIdx,
      endIndex: endIdx,
      totalHeight: plan.exercises.length * itemHeight,
      items: plan.exercises.slice(startIdx, endIdx)
    };
  }, [plan, scrollTop, viewportHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 700,
    color: '#E0E0E0'
  };

  const backBtnStyle: React.CSSProperties = {
    padding: '8px 20px',
    backgroundColor: '#2A2A2A',
    color: '#E0E0E0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'filter 0.2s'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#1E1E1E',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(255,255,255,0.04)'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#F5F5F5',
    color: '#121212',
    border: '2px solid #E0E0E0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 28px',
    backgroundColor: '#7C4DFF',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'filter 0.2s'
  };

  const getCardStyle = (completed: boolean, actualSets: number, targetSets: number): React.CSSProperties => {
    const borderColor = completed ? '#4CAF50' : actualSets > 0 && actualSets < targetSets ? '#FFD54F' : '#E0E0E0';
    return {
      backgroundColor: '#1E1E1E',
      borderRadius: '12px',
      padding: '20px',
      border: `2px solid ${borderColor}`,
      transition: 'all 0.4s ease',
      transform: completed ? 'scale(1.02)' : 'scale(1)',
      boxShadow: '0 2px 8px rgba(255,255,255,0.04)',
      marginBottom: 0
    };
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>🏃 学员训练中心</h1>
        <button
          style={backBtnStyle}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
        >
          ← 返回
        </button>
      </div>

      {!plan ? (
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '20px', color: '#E0E0E0', marginBottom: '20px' }}>🔑 输入邀请码</h2>
          <label style={{ display: 'block', fontSize: '14px', color: '#B0B0B0', marginBottom: '8px' }}>
            你的姓名
          </label>
          <input
            style={{ ...inputStyle, marginBottom: '16px' }}
            type="text"
            placeholder="请输入你的姓名"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
          />
          <label style={{ display: 'block', fontSize: '14px', color: '#B0B0B0', marginBottom: '8px' }}>
            教练分享的邀请码
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ ...inputStyle, flex: 1, marginTop: 0, textTransform: 'uppercase' }}
              type="text"
              placeholder="例如：AB12CD"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
              onKeyDown={(e) => e.key === 'Enter' && handleFetchPlan()}
            />
            <button
              style={{ ...buttonStyle }}
              onClick={handleFetchPlan}
              onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
              disabled={!inviteCode.trim() || loading}
            >
              {loading ? '加载中...' : '获取计划'}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: '16px', color: '#FF5252', fontSize: '14px' }}>⚠️ {error}</div>
          )}
        </div>
      ) : (
        <>
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', color: '#E0E0E0', fontWeight: 600 }}>{plan.name}</h2>
                <p style={{ color: '#808080', fontSize: '13px', marginTop: '4px' }}>
                  {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' · '}
                  共 {plan.exercises.length} 个动作
                </p>
              </div>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#7C4DFF',
                  border: '1px solid #7C4DFF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                onClick={() => {
                  setPlan(null);
                  setInviteCode('');
                }}
              >
                切换计划
              </button>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              style={{
                height: 'calc(100vh - 280px)',
                minHeight: '400px',
                overflowY: 'auto',
                position: 'relative'
              }}
            >
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${startIndex * itemHeight}px)`,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '16px',
                    padding: '0 0 16px 0'
                  }}
                >
                  {items.map((ex: Exercise, idx: number) => {
                    const log = exerciseLogs.get(ex.id);
                    const actualSets = log?.actualSets || 0;
                    const completed = !!log?.completed;
                    const globalIdx = startIndex + idx;
                    return (
                      <div
                        key={ex.id}
                        style={{
                          ...getCardStyle(completed, actualSets, ex.sets),
                          order: globalIdx
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '18px', color: '#E0E0E0', fontWeight: 600 }}>
                              {globalIdx + 1}. {ex.name}
                            </h3>
                            <p style={{ color: '#808080', fontSize: '13px', marginTop: '4px' }}>
                              目标：{ex.sets} 组 × {ex.reps} 次
                            </p>
                            <p style={{ color: '#808080', fontSize: '13px' }}>
                              组间休息：{ex.restSeconds} 秒
                            </p>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={completed}
                              onChange={() => toggleComplete(ex.id)}
                              style={{
                                width: '22px',
                                height: '22px',
                                cursor: 'pointer',
                                accentColor: '#4CAF50'
                              }}
                            />
                            <span style={{ color: completed ? '#4CAF50' : '#B0B0B0', fontSize: '13px' }}>
                              {completed ? '✓ 完成' : '未完成'}
                            </span>
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                          <span style={{ color: '#B0B0B0', fontSize: '14px' }}>实际完成组数：</span>
                          <input
                            type="number"
                            min={0}
                            max={ex.sets + 5}
                            value={actualSets}
                            onChange={(e) => updateActualSets(ex.id, parseInt(e.target.value) || 0)}
                            style={{
                              width: '80px',
                              padding: '8px 10px',
                              backgroundColor: '#F5F5F5',
                              color: '#121212',
                              border: '2px solid #E0E0E0',
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none',
                              textAlign: 'center',
                              transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#7C4DFF')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = '#E0E0E0')}
                          />
                          <span style={{ color: '#808080', fontSize: '13px' }}>/ {ex.sets} 组</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showCelebrate && (
        <div
          className={celebratePhase === 'enter' ? 'celebrate-enter' : celebratePhase === 'exit' ? 'celebrate-exit' : ''}
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '16px 36px',
            borderRadius: '50px',
            backgroundColor: 'rgba(30, 30, 30, 0.95)',
            border: '2px solid #FFD700',
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3)'
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FFD700, #FF6F00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {celebrateMsg}
          </span>
        </div>
      )}
    </div>
  );
};

export default ClientPanel;
