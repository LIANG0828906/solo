import { useRef, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { SpeechRecord } from '../types';
import { formatTime, formatTimeFull, calculateSpeakingRate } from '../utils/helpers';
import html2canvas from 'html2canvas';

interface SummaryProps {
  record: SpeechRecord;
  onReturn: () => void;
}

function Summary({ record, onReturn }: SummaryProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totalPlanned = record.stages.reduce((sum, s) => sum + s.plannedDuration, 0);
  const timeDiff = record.totalDuration - totalPlanned;
  const speakingRate = calculateSpeakingRate(record.totalWordCount, record.totalDuration);

  const chartData = record.stages.map((stage, idx) => {
    const actual = stage.actualDuration || 0;
    const diff = actual - stage.plannedDuration;
    return {
      index: idx + 1,
      name: stage.name,
      计划: stage.plannedDuration,
      实际: Math.min(actual, stage.plannedDuration),
      超出: diff > 0 ? diff : 0,
      节省: diff < 0 ? -diff : 0,
      diff,
      totalActual: actual,
    };
  });

  const handleExport = async () => {
    if (!exportRef.current) return;

    setIsExporting(true);

    await new Promise((resolve) => setTimeout(resolve, 850));

    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `演讲总结_${new Date(record.date).toLocaleDateString('zh-CN')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const formatTooltipValue = (value: number) => formatTimeFull(value);

  return (
    <div className={`summary-container ${isExporting ? 'summary-exporting' : ''}`}>
      <div className="summary-inner" ref={exportRef}>
        <div className="summary-header">
          <h1 className="summary-title">📊 演讲总结报告</h1>
          <div className="summary-header-actions">
            {!isExporting && (
              <>
                <button className="btn-secondary" onClick={onReturn}>
                  ← 返回
                </button>
                <button className="btn-export" onClick={handleExport}>
                  📥 导出 PNG
                </button>
              </>
            )}
          </div>
        </div>

        <div className="summary-stats">
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-label">总用时</div>
            <div className="stat-value accent">{formatTime(record.totalDuration)}</div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              计划 {formatTime(totalPlanned)}
              {timeDiff !== 0 && (
                <span style={{ marginLeft: 8, color: timeDiff > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  {timeDiff > 0 ? '+' : ''}
                  {formatTime(timeDiff)}
                </span>
              )}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🗣️</div>
            <div className="stat-label">平均语速</div>
            <div className="stat-value">
              {speakingRate > 0 ? speakingRate : '--'}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {' '}字/分
              </span>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {record.totalWordCount > 0
                ? `共 ${record.totalWordCount} 字`
                : '未设置总字数'}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-label">阶段数</div>
            <div className="stat-value accent">{record.stages.length}</div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              已完成 {record.stages.filter((s) => (s.actualDuration || 0) > 0).length} 个
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-label">演讲日期</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>
              {new Date(record.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date(record.date).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>

        <div className="summary-content">
          <h3 className="chart-section-title">📈 各阶段时长对比分析</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.08)"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  type="number"
                  stroke="rgba(255,255,255,0.5)"
                  tickFormatter={(v) => formatTime(v)}
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="rgba(255,255,255,0.5)"
                  width={100}
                  tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12,
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}
                  formatter={(value: number, name) => [formatTooltipValue(value), name]}
                  labelStyle={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: 20,
                  }}
                  iconType="rect"
                  formatter={(value) => (
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{value}</span>
                  )}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                <Bar
                  dataKey="计划"
                  fill="rgba(66, 153, 225, 0.6)"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="实际"
                  stackId="actual"
                  fill="#48bb78"
                  radius={[0, 0, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="超出"
                  stackId="actual"
                  fill="#e53e3e"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-save-${index}`} fill={entry.节省 > 0 ? '#48bb78' : '#48bb78'} />
                  ))}
                </Bar>
                <Bar
                  dataKey="节省"
                  stackId="save"
                  fill="rgba(72, 187, 120, 0.4)"
                  radius={[0, 0, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <h3 className="chart-section-title" style={{ marginBottom: 16 }}>
              📝 各阶段明细
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {record.stages.map((stage, idx) => {
                const actual = stage.actualDuration || 0;
                const diff = actual - stage.plannedDuration;
                const isOvertime = diff > 5;
                const isSaved = diff < -5;

                return (
                  <div
                    key={stage.id}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${
                        isOvertime
                          ? 'rgba(229, 62, 62, 0.3)'
                          : isSaved
                          ? 'rgba(72, 187, 120, 0.3)'
                          : 'rgba(255,255,255,0.08)'
                      }`,
                      transition: 'all var(--transition)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--text-light)',
                          fontSize: '0.95rem',
                        }}
                      >
                        {stage.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                      <div>计划：{formatTimeFull(stage.plannedDuration)}</div>
                      <div style={{ color: 'var(--text-light)' }}>
                        实际：{formatTimeFull(actual)}
                      </div>
                      {diff !== 0 && (
                        <div
                          style={{
                            marginTop: 4,
                            fontWeight: 600,
                            color: isOvertime
                              ? 'var(--danger)'
                              : isSaved
                              ? 'var(--success)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {(() => {
                            let label = '偏差';
                            if (isOvertime) label = '超时';
                            else if (isSaved) label = '节省';
                            return label + '\uff1a';
                          })()}
                          {diff > 0 ? '+' : ''}
                          {formatTimeFull(Math.abs(diff))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {isExporting && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                padding: '24px 40px',
                borderRadius: 16,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                color: 'white',
                fontWeight: 600,
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: 'var(--accent-light)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              正在导出图片...
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default Summary;
