import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from 'recharts';
import { FaPlay, FaLightbulb, FaSpinner } from 'react-icons/fa';
import { Deck } from '../domain/cardData';
import { eventBus, EventType } from '../eventBus';
import {
  startSimulation,
  BattleResult,
  BalanceSuggestion,
  generateBalanceSuggestions,
} from '../battle/simulator';

interface BattleRunnerProps {
  leftDeck: Deck;
  rightDeck: Deck;
}

const FIELD_LABEL: Record<string, string> = {
  cost: '费用',
  attack: '攻击力',
  defense: '防御力',
  skillValue: '技能参数',
};

const BattleRunner: React.FC<BattleRunnerProps> = ({ leftDeck, rightDeck }) => {
  const [simulating, setSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [suggestions, setSuggestions] = useState<BalanceSuggestion[]>([]);

  useEffect(() => {
    const unsubStart = eventBus.on(EventType.BATTLE_START, () => {
      setSimulating(true);
      setProgress(0);
      setSuggestions([]);
    });
    const unsubProgress = eventBus.on(EventType.BATTLE_PROGRESS, (data) => {
      const p = data as { progress: number };
      setProgress(p.progress);
    });
    const unsubComplete = eventBus.on(EventType.BATTLE_COMPLETE, (data) => {
      const r = data as BattleResult;
      setResult(r);
      setSimulating(false);
      setProgress(1);
      setSuggestions(generateBalanceSuggestions(leftDeck, rightDeck, r));
    });
    return () => {
      unsubStart();
      unsubProgress();
      unsubComplete();
    };
  }, [leftDeck, rightDeck]);

  const handleStart = () => {
    if (leftDeck.length === 0 || rightDeck.length === 0) return;
    startSimulation([...leftDeck], [...rightDeck]);
  };

  const handleApplySuggestion = (s: BalanceSuggestion) => {
    eventBus.emit(EventType.SUGGESTION_APPLY, {
      cardId: s.cardId,
      deckSide: s.deckSide,
      field: s.field,
      to: s.to,
    });
    setSuggestions((prev) => prev.filter((x) => x.cardId !== s.cardId || x.field !== s.field));
  };

  const winRate = useMemo(() => {
    if (!result) return 0;
    const total = result.leftWins + result.rightWins;
    if (total === 0) return 0;
    return (result.leftWins / total) * 100;
  }, [result]);

  const winRateColor = useMemo(() => {
    const r = Math.round(231 - ((231 - 46) * Math.max(0, Math.min(100, winRate))) / 100);
    const g = Math.round((76 + (204 - 76) * Math.max(0, Math.min(100, winRate))) / 100);
    const b = Math.round((60 + (113 - 60) * Math.max(0, Math.min(100, winRate))) / 100);
    return `rgb(${r}, ${g}, ${b})`;
  }, [winRate]);

  const lineChartData = useMemo(() => {
    if (!result) return [];
    return result.winRateCurve.map((v, i) => ({ battle: i + 1, winRate: v }));
  }, [result]);

  const barChartData = useMemo(() => {
    if (!result) return [];
    return [
      {
        stat: '平均攻击',
        left: result.leftDeckStats.avgAttack,
        right: result.rightDeckStats.avgAttack,
      },
      {
        stat: '平均防御',
        left: result.leftDeckStats.avgDefense,
        right: result.rightDeckStats.avgDefense,
      },
      {
        stat: '总费用',
        left: result.leftDeckStats.totalCost,
        right: result.rightDeckStats.totalCost,
      },
    ];
  }, [result]);

  const canStart = leftDeck.length > 0 && rightDeck.length > 0 && !simulating;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid #3A3A55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: 10,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: '#E0E0E0' }}>战斗模拟</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: canStart ? '#2C3E50' : '#3A3A55',
              color: canStart ? '#FFF' : '#666',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background-color 0.1s ease-out',
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
            onMouseDown={(e) => {
              if (canStart) e.currentTarget.style.backgroundColor = '#1A252F';
            }}
            onMouseUp={(e) => {
              if (canStart) e.currentTarget.style.backgroundColor = '#2C3E50';
            }}
            onMouseLeave={(e) => {
              if (canStart) e.currentTarget.style.backgroundColor = '#2C3E50';
            }}
          >
            {simulating ? (
              <FaSpinner size={13} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <FaPlay size={11} />
            )}
            {simulating ? `模拟中 ${Math.round(progress * 100)}%` : '开始模拟'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
        {!result && !simulating && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#555',
              fontSize: 13,
            }}
          >
            请先在两侧编组区添加卡牌，然后点击「开始模拟」
          </div>
        )}

        {simulating && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#FFF',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ color: '#AAA', fontSize: 13 }}>
              正在运行 100 场战斗模拟...
            </div>
            <div
              style={{
                width: 240,
                height: 6,
                backgroundColor: '#3A3A55',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1 }}
                style={{
                  height: '100%',
                  backgroundColor: '#3498DB',
                }}
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {result && !simulating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: '#282840',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      background: `linear-gradient(135deg, #E74C3C, ${winRateColor}, #2ECC71)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1,
                    }}
                  >
                    {winRate.toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>左方胜率</div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px 24px',
                    fontSize: 13,
                  }}
                >
                  <div style={{ color: '#888' }}>平均回合</div>
                  <div style={{ color: '#E0E0E0', fontWeight: 600, textAlign: 'right' }}>
                    {result.avgTurns}
                  </div>
                  <div style={{ color: '#888' }}>左方总伤害</div>
                  <div style={{ color: '#3498DB', fontWeight: 600, textAlign: 'right' }}>
                    {result.totalDamageLeft}
                  </div>
                  <div style={{ color: '#888' }}>右方总伤害</div>
                  <div style={{ color: '#E74C3C', fontWeight: 600, textAlign: 'right' }}>
                    {result.totalDamageRight}
                  </div>
                  <div style={{ color: '#888' }}>左方总回复</div>
                  <div style={{ color: '#2ECC71', fontWeight: 600, textAlign: 'right' }}>
                    {result.totalHealLeft}
                  </div>
                  <div style={{ color: '#888' }}>右方总回复</div>
                  <div style={{ color: '#2ECC71', fontWeight: 600, textAlign: 'right' }}>
                    {result.totalHealRight}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: '#282840',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0', marginBottom: 8 }}>
                  胜率累积曲线
                </div>
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3A3A55" />
                      <XAxis dataKey="battle" stroke="#888" fontSize={10} tick={{ fill: '#888' }} />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#888"
                        fontSize={10}
                        tick={{ fill: '#888' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#282840',
                          border: '1px solid #3A3A55',
                          borderRadius: 6,
                          color: '#E0E0E0',
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${v.toFixed(1)}%`, '累积胜率']}
                        labelFormatter={(l) => `第 ${l} 场`}
                      />
                      <Line
                        type="monotone"
                        dataKey="winRate"
                        stroke="#3498DB"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#3498DB' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: '#282840',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0', marginBottom: 8 }}>
                  卡组属性对比
                </div>
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3A3A55" />
                      <XAxis dataKey="stat" stroke="#888" fontSize={11} tick={{ fill: '#888' }} />
                      <YAxis stroke="#888" fontSize={10} tick={{ fill: '#888' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#282840',
                          border: '1px solid #3A3A55',
                          borderRadius: 6,
                          color: '#E0E0E0',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="left" name="左方" radius={[6, 6, 0, 0]} barSize={24}>
                        <LabelList dataKey="left" position="top" fill="#3498DB" fontSize={10} />
                        {barChartData.map((_, i) => (
                          <Cell key={`l-${i}`} fill="#3498DB" />
                        ))}
                      </Bar>
                      <Bar dataKey="right" name="右方" radius={[6, 6, 0, 0]} barSize={24}>
                        <LabelList dataKey="right" position="top" fill="#E74C3C" fontSize={10} />
                        {barChartData.map((_, i) => (
                          <Cell key={`r-${i}`} fill="#E74C3C" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: '#282840',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaLightbulb color="#F39C12" size={14} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0' }}>
                      平衡建议
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#888' }}>
                    {suggestions.length === 0 ? '卡组已接近平衡' : `${suggestions.length} 条建议`}
                  </span>
                </div>
                {suggestions.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#555', padding: '12px 0' }}>
                    胜率偏差小于 5%，当前卡组组合较为平衡。
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {suggestions.map((s, i) => {
                      const sideLabel = s.deckSide === 'left' ? '左方' : '右方';
                      const sideColor = s.deckSide === 'left' ? '#3498DB' : '#E74C3C';
                      return (
                        <div
                          key={`${s.cardId}-${s.field}-${i}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 8,
                            backgroundColor: '#1E1E2E',
                            border: '1px solid #3A3A55',
                            gap: 10,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  backgroundColor: sideColor,
                                  color: '#FFF',
                                  fontWeight: 600,
                                }}
                              >
                                {sideLabel}
                              </span>
                              <span style={{ fontSize: 12, color: '#E0E0E0', fontWeight: 600 }}>
                                {FIELD_LABEL[s.field]}: {s.from} → {s.to}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#888' }}>{s.reason}</div>
                          </div>
                          <button
                            onClick={() => handleApplySuggestion(s)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              backgroundColor: '#27AE60',
                              color: '#FFF',
                              fontSize: 12,
                              fontWeight: 600,
                              flexShrink: 0,
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#219A52')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#27AE60')}
                          >
                            应用
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default BattleRunner;
