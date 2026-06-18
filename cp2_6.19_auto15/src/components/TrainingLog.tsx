import { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LinearGradient,
  Defs,
  CartesianGrid,
} from 'recharts';
import './TrainingLog.css';

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

interface PlannedExercise {
  planId: string;
  actionId: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetReps: number;
  targetWeight: number;
}

interface WeeklyPlan {
  weekKey: string;
  days: Record<DayOfWeek, PlannedExercise[]>;
}

interface LoggedSet {
  setNumber: number;
  actualReps: number;
  actualWeight: number;
}

interface TrainingLogEntry {
  logId: string;
  planId: string;
  actionId: string;
  day: DayOfWeek;
  weekKey: string;
  loggedSets: LoggedSet[];
  completedAt?: string;
}

interface TrainingLogProps {
  weekKey: string;
  plan: WeeklyPlan;
  logs: TrainingLogEntry[];
  onUpdateLog: (log: TrainingLogEntry) => void;
}

interface TrendDataPoint {
  weekLabel: string;
  totalVolume: number;
  targetVolume: number;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: '周一' },
  { key: 'tuesday', label: '周二' },
  { key: 'wednesday', label: '周三' },
  { key: 'thursday', label: '周四' },
  { key: 'friday', label: '周五' },
  { key: 'saturday', label: '周六' },
  { key: 'sunday', label: '周日' },
];

const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: '#ff6b6b',
  back: '#45b7d1',
  legs: '#4ecdc4',
  shoulders: '#96ceb4',
  arms: '#ffeaa7',
  core: '#dda0dd',
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: '胸部',
  back: '背部',
  legs: '腿部',
  shoulders: '肩部',
  arms: '手臂',
  core: '核心',
};

function calcTargetVolume(p: PlannedExercise): number {
  return p.targetSets * p.targetReps * p.targetWeight;
}

function calcActualVolume(loggedSets: LoggedSet[]): number {
  return loggedSets.reduce((sum, set) => sum + set.actualReps * set.actualWeight, 0);
}

function calcCompletionPercent(targetV: number, actualV: number): number {
  if (targetV === 0) return 0;
  const percent = (actualV / targetV) * 100;
  return Math.max(0, percent);
}

function clampPercent(percent: number): number {
  return Math.min(100, percent);
}

function getProgressGradient(percent: number): string {
  if (percent >= 100) return 'linear-gradient(90deg, #66bb6a, #43a047)';
  if (percent >= 80) return 'linear-gradient(90deg, #ffa726, #ff7043)';
  return 'linear-gradient(90deg, #4ecdc4, #45b7d1)';
}

function getPulseColor(percent: number): string {
  if (percent >= 100) return '#66bb6a';
  if (percent >= 80) return '#ffa726';
  return '#4ecdc4';
}

function parseWeekKey(weekKey: string): Date {
  return new Date(weekKey);
}

function formatDateMMDD(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function generateWeekKey(offsetWeeks: number, baseWeekKey: string): string {
  const baseDate = parseWeekKey(baseWeekKey);
  const targetDate = addDays(baseDate, offsetWeeks * 7);
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TrainingLog({ weekKey, plan, logs, onUpdateLog }: TrainingLogProps) {
  const [currentTab, setCurrentTab] = useState<'log' | 'trend'>('log');
  const [expandedDays, setExpandedDays] = useState<Set<DayOfWeek>>(new Set(DAYS.map(d => d.key)));
  const [trendOffset, setTrendOffset] = useState(0);
  const [displayTrendData, setDisplayTrendData] = useState<TrendDataPoint[]>([]);
  const [slideAnimClass, setSlideAnimClass] = useState<string>('');
  const slideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTrendOffsetRef = useRef(0);
  const isFirstTrendLoadRef = useRef(true);

  const toggleDay = (day: DayOfWeek) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const findLogEntry = (planId: string, day: DayOfWeek): TrainingLogEntry | undefined => {
    return logs.find(l => l.planId === planId && l.day === day && l.weekKey === weekKey);
  };

  const getLoggedSetsOrDefault = (
    planExercise: PlannedExercise,
    day: DayOfWeek
  ): LoggedSet[] => {
    const entry = findLogEntry(planExercise.planId, day);
    if (entry) return entry.loggedSets;
    const sets: LoggedSet[] = [];
    for (let i = 1; i <= planExercise.targetSets; i++) {
      sets.push({ setNumber: i, actualReps: 0, actualWeight: 0 });
    }
    return sets;
  };

  const handleSetChange = (
    planExercise: PlannedExercise,
    day: DayOfWeek,
    setNumber: number,
    field: 'actualReps' | 'actualWeight',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    const existingEntry = findLogEntry(planExercise.planId, day);
    let loggedSets: LoggedSet[];

    if (existingEntry) {
      loggedSets = existingEntry.loggedSets.map(s =>
        s.setNumber === setNumber ? { ...s, [field]: numValue } : s
      );
      const missingCount = planExercise.targetSets - loggedSets.length;
      for (let i = loggedSets.length + 1; i <= planExercise.targetSets; i++) {
        loggedSets.push({ setNumber: i, actualReps: 0, actualWeight: 0 });
      }
    } else {
      loggedSets = [];
      for (let i = 1; i <= planExercise.targetSets; i++) {
        if (i === setNumber) {
          loggedSets.push({
            setNumber: i,
            actualReps: field === 'actualReps' ? numValue : 0,
            actualWeight: field === 'actualWeight' ? numValue : 0,
          });
        } else {
          loggedSets.push({ setNumber: i, actualReps: 0, actualWeight: 0 });
        }
      }
    }

    const entry: TrainingLogEntry = {
      logId: existingEntry?.logId ?? `log-${planExercise.planId}-${day}-${Date.now()}`,
      planId: planExercise.planId,
      actionId: planExercise.actionId,
      day,
      weekKey,
      loggedSets,
      completedAt: existingEntry?.completedAt,
    };
    onUpdateLog(entry);
  };

  useEffect(() => {
    if (slideTimeoutRef.current) {
      clearTimeout(slideTimeoutRef.current);
    }
  }, []);

  const trendData = useMemo<TrendDataPoint[]>(() => {
    const data: TrendDataPoint[] = [];
    const startOffset = trendOffset - 7;

    for (let i = 0; i < 8; i++) {
      const wkKey = generateWeekKey(startOffset + i, weekKey);
      const weekStartDate = parseWeekKey(wkKey);
      const weekLabel = formatDateMMDD(weekStartDate);

      let targetVolume = 0;
      if (wkKey === weekKey) {
        for (const day of DAYS) {
          const exercises = plan.days[day.key] || [];
          for (const ex of exercises) {
            targetVolume += calcTargetVolume(ex);
          }
        }
      }

      let totalVolume = 0;
      for (const log of logs) {
        if (log.weekKey === wkKey) {
          totalVolume += calcActualVolume(log.loggedSets);
        }
      }

      data.push({ weekLabel, totalVolume, targetVolume });
    }

    return data;
  }, [trendOffset, weekKey, plan, logs]);

  const handlePrevWeek = () => {
    setTrendOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    setTrendOffset(prev => prev + 1);
  };

  useEffect(() => {
    if (isFirstTrendLoadRef.current) {
      if (trendData.length > 0) {
        setDisplayTrendData(trendData);
        isFirstTrendLoadRef.current = false;
      }
      return;
    }

    if (prevTrendOffsetRef.current === trendOffset) return;

    const direction = trendOffset > prevTrendOffsetRef.current ? 'left' : 'right';
    prevTrendOffsetRef.current = trendOffset;

    if (slideTimeoutRef.current) {
      clearTimeout(slideTimeoutRef.current);
    }

    setSlideAnimClass(`slide-out-${direction}`);

    slideTimeoutRef.current = setTimeout(() => {
      setDisplayTrendData(trendData);
      setSlideAnimClass(`slide-in-${direction}`);
      slideTimeoutRef.current = setTimeout(() => {
        setSlideAnimClass('');
        slideTimeoutRef.current = null;
      }, 400);
    }, 400);
  }, [trendOffset, trendData]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '10px 14px',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px',
        }}>
          <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} style={{ margin: '2px 0', color: '#666' }}>
              {entry.name}: <strong style={{ color: '#333' }}>{entry.value.toFixed(0)} kg</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="training-log">
      <div className="tabs">
        <button
          className={`tab-btn ${currentTab === 'log' ? 'active' : ''}`}
          onClick={() => setCurrentTab('log')}
        >
          训练日志/进度
        </button>
        <button
          className={`tab-btn ${currentTab === 'trend' ? 'active' : ''}`}
          onClick={() => setCurrentTab('trend')}
        >
          周训练量趋势
        </button>
      </div>

      {currentTab === 'log' && (
        <div>
          {DAYS.map(day => {
            const exercises = plan.days[day.key] || [];
            const isExpanded = expandedDays.has(day.key);
            return (
              <div key={day.key} className="day-section">
                <div className="day-header" onClick={() => toggleDay(day.key)} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  {day.label} {isExpanded ? '▼' : '▶'}
                </div>
                {isExpanded && (
                  exercises.length === 0 ? (
                    <div className="day-empty">暂无训练安排</div>
                  ) : (
                    exercises.map(planExercise => {
                      const loggedSets = getLoggedSetsOrDefault(planExercise, day.key);
                      const targetV = calcTargetVolume(planExercise);
                      const actualV = calcActualVolume(loggedSets);
                      const percent = calcCompletionPercent(targetV, actualV);
                      const clampedPercent = clampPercent(percent);
                      const shouldPulse = percent >= 50 && actualV > 0;

                      const gradient = getProgressGradient(percent);
                      const pulseColor = getPulseColor(percent);
                      const setVolume = (s: LoggedSet) => s.actualReps * s.actualWeight;

                      return (
                        <div key={planExercise.planId} className="exercise-row">
                          <div className="exercise-header">
                            <div className="exercise-title">
                              <span className="exercise-name">{planExercise.name}</span>
                              <span
                                className="muscle-tag"
                                style={{ background: MUSCLE_COLORS[planExercise.muscleGroup] }}
                              >
                                {MUSCLE_LABELS[planExercise.muscleGroup]}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                              {planExercise.targetSets}组 × {planExercise.targetReps}次 × {planExercise.targetWeight}kg
                            </div>
                          </div>

                          <div className="sets-log">
                            {Array.from({ length: planExercise.targetSets }, (_, i) => i + 1).map(setNum => {
                              const set = loggedSets.find(s => s.setNumber === setNum) ?? {
                                setNumber: setNum,
                                actualReps: 0,
                                actualWeight: 0,
                              };
                              return (
                                <div key={setNum} className="set-row">
                                  <div className="set-num">#{setNum}</div>
                                  <div className="input-wrap">
                                    <label>次数</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={set.actualReps === 0 ? '' : set.actualReps}
                                      placeholder="0"
                                      onChange={(e) =>
                                        handleSetChange(planExercise, day.key, setNum, 'actualReps', e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="input-wrap">
                                    <label>重量(kg)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={set.actualWeight === 0 ? '' : set.actualWeight}
                                      placeholder="0"
                                      onChange={(e) =>
                                        handleSetChange(planExercise, day.key, setNum, 'actualWeight', e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="volume-label">
                                    {setVolume(set).toFixed(0)}kg
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="progress-section">
                            <div className="volume-info">
                              <span>目标: {targetV.toFixed(0)} kg</span>
                              <span>实际: {actualV.toFixed(0)} kg</span>
                            </div>
                            <div className="progress-bar-container">
                              <div
                                className={`progress-bar-fill ${shouldPulse ? 'pulse' : ''}`}
                                style={{
                                  width: `${clampedPercent}%`,
                                  background: gradient,
                                  ['--pulse-color' as any]: pulseColor,
                                }}
                              />
                              <span className="percent-text">{percent.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {currentTab === 'trend' && (
        <div className="trend-container">
          <div className="trend-header">
            <div className="trend-title">周训练量趋势（近8周）</div>
            <div className="trend-nav-group">
              <button className="trend-nav-btn" onClick={handlePrevWeek}>
                ← 上一周
              </button>
              <button className="trend-nav-btn" onClick={handleNextWeek}>
                下一周 →
              </button>
            </div>
          </div>
          <div className={`trend-chart-wrap ${slideAnimClass}`}>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={displayTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <Defs>
                  <LinearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ecdc4" />
                    <stop offset="100%" stopColor="#45b7d1" />
                  </LinearGradient>
                  <LinearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e0e0e0" />
                    <stop offset="100%" stopColor="#bdbdbd" />
                  </LinearGradient>
                </Defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={{ stroke: '#eee' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={{ stroke: '#eee' }}
                  tickLine={false}
                  label={{
                    value: '训练量 (kg)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 12, fill: '#888', textAnchor: 'middle' },
                    offset: 5,
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="rect"
                />
                <Bar
                  dataKey="totalVolume"
                  name="实际量"
                  fill="url(#volumeGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="targetVolume"
                  name="目标量"
                  fill="url(#targetGradient)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
