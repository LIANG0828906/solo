import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import EmotionCard from './components/EmotionCard';
import {
  submitEmotion,
  fetchTimeline,
  fetchRecords,
  fetchReport,
  fetchHeatmap,
  EmotionRecord,
  TimelineData,
  WeeklyReport,
  HeatmapCell,
} from './services/apiService';

type Tab = 'record' | 'wall' | 'report' | 'dashboard';

const EMOTIONS = [
  { key: 'happy', emoji: '😊', label: '开心', color: '#FFD93D' },
  { key: 'calm', emoji: '😌', label: '平静', color: '#6BCB77' },
  { key: 'anxious', emoji: '😰', label: '焦虑', color: '#4D96FF' },
  { key: 'irritable', emoji: '😤', label: '烦躁', color: '#FF6B6B' },
  { key: 'tired', emoji: '😫', label: '疲惫', color: '#9B59B6' },
];

const EMOTION_SCORES: Record<string, number> = {
  happy: 5,
  calm: 4,
  anxious: 2,
  irritable: 1,
  tired: 3,
};

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const HOURS = ['9:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('record');
  const [note, setNote] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [records, setRecords] = useState<EmotionRecord[]>([]);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tl, rec, rep, hm] = await Promise.all([
        fetchTimeline(),
        fetchRecords(),
        fetchReport(),
        fetchHeatmap(),
      ]);
      setTimeline(tl);
      setRecords(rec);
      setReport(rep);
      setShowReport(!!rep);
      setHeatmap(hm);
    } catch {
      // server might not be ready yet
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!selectedEmotion) return;
    setSubmitting(true);
    try {
      await submitEmotion(selectedEmotion, note);
      setSelectedEmotion(null);
      setNote('');
      loadData();
    } catch {}
    setSubmitting(false);
  };

  const getHeatmapColor = (score: number) => {
    const t = Math.max(0, Math.min(1, (score - 1) / 4));
    const r = Math.round(107 + (255 - 107) * t);
    const g = Math.round(203 + (107 - 203) * t);
    const b = Math.round(119 + (107 - 119) * t);
    return `rgb(${r},${g},${b})`;
  };

  const renderRecordTab = () => (
    <div className="tab-content fade-in-up">
      <h2 className="section-title">此刻心情</h2>
      <div className="emotion-selector">
        {EMOTIONS.map((e) => (
          <button
            key={e.key}
            className={`emotion-btn ${selectedEmotion === e.key ? 'emotion-btn-active' : ''}`}
            style={{
              '--btn-color': e.color,
              borderColor: selectedEmotion === e.key ? e.color : 'transparent',
            } as React.CSSProperties}
            onClick={() => setSelectedEmotion(e.key)}
          >
            <span className="emotion-btn-emoji">{e.emoji}</span>
            <span className="emotion-btn-label">{e.label}</span>
          </button>
        ))}
      </div>
      <textarea
        className="note-input"
        maxLength={140}
        placeholder="写点什么...（最多140字）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="char-count">{note.length}/140</div>
      <button
        className="primary-btn"
        disabled={!selectedEmotion || submitting}
        onClick={handleSubmit}
      >
        {submitting ? '记录中...' : '记录心情'}
      </button>

      {timeline.length > 0 && (
        <div className="timeline-section">
          <h3 className="section-subtitle">本周情绪时间线</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={timeline} barCategoryGap="20%">
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {EMOTIONS.map((e) => (
                <Bar
                  key={e.key}
                  dataKey={e.label}
                  fill={e.color}
                  stackId="a"
                  animationDuration={300}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const renderWallTab = () => (
    <div className="tab-content fade-in-up">
      <h2 className="section-title">匿名情绪墙</h2>
      <div className="emotion-wall">
        {records.map((r) => (
          <EmotionCard key={r.id} record={r} />
        ))}
      </div>
      {records.length === 0 && (
        <p className="empty-hint">还没有情绪记录，去记录你的心情吧 🌈</p>
      )}
    </div>
  );

  const renderReportTab = () => {
    if (!report) {
      return (
        <div className="tab-content fade-in-up">
          <h2 className="section-title">趋势报告</h2>
          <p className="empty-hint">本周暂无报告数据</p>
        </div>
      );
    }
    const peakEmoji =
      EMOTIONS.find((e) => e.key === report.peak_emotion)?.emoji || '😌';
    const peakLabel =
      EMOTIONS.find((e) => e.key === report.peak_emotion)?.label || '平静';
    return (
      <div className="tab-content fade-in-up">
        <h2 className="section-title">上周情绪报告</h2>
        <div className="report-card">
          <div className="report-row">
            <span className="report-label">峰值情绪</span>
            <span>
              {peakEmoji} {peakLabel}
            </span>
          </div>
          <div className="report-row">
            <span className="report-label">平均情绪值</span>
            <span>{report.avg_score.toFixed(1)} / 5.0</span>
          </div>
          <div className="report-distribution">
            {EMOTIONS.map((e) => (
              <div key={e.key} className="dist-bar-row">
                <span className="dist-label">
                  {e.emoji} {e.label}
                </span>
                <div className="dist-bar-bg">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${((report.distribution[e.key] || 0) * 100).toFixed(0)}%`,
                      backgroundColor: e.color,
                    }}
                  />
                </div>
                <span className="dist-pct">
                  {((report.distribution[e.key] || 0) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
          <div className="report-tips">
            <span className="tips-icon">💡</span> {report.tips}
          </div>
        </div>
      </div>
    );
  };

  const renderDashboardTab = () => (
    <div className="tab-content fade-in-up">
      <h2 className="section-title">团队聚合仪表盘</h2>
      <div className="heatmap-container">
        <div className="heatmap-grid">
          <div className="heatmap-corner" />
          {HOURS.map((h) => (
            <div key={h} className="heatmap-header">
              {h}
            </div>
          ))}
          {DAYS.map((day, di) => (
            <React.Fragment key={day}>
              <div className="heatmap-header">{day}</div>
              {HOURS.map((_, hi) => {
                const cell = heatmap.find((c) => c.day === di && c.hour === hi);
                return (
                  <div
                    key={`${di}-${hi}`}
                    className="heatmap-cell"
                    style={{
                      backgroundColor: cell ? getHeatmapColor(cell.score) : '#f0f4f8',
                    }}
                    onMouseEnter={() => cell && setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {hoveredCell === cell && cell && (
                      <div className="heatmap-tooltip">
                        <div>人数: {cell.count}</div>
                        <div>主要情绪: {cell.dominant_emotion}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>😊 好</span>
          <div className="legend-gradient" />
          <span>😰 差</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🌈 MoodFlow</h1>
        <p className="app-subtitle">记录情绪，发现自我</p>
      </header>

      <nav className="tab-nav">
        {([
          ['record', '📝 记录'],
          ['wall', '🗣 情绪墙'],
          ['report', '📊 报告'],
          ['dashboard', '🔥 热力图'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn ${tab === key ? 'tab-btn-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'record' && renderRecordTab()}
        {tab === 'wall' && renderWallTab()}
        {tab === 'report' && renderReportTab()}
        {tab === 'dashboard' && renderDashboardTab()}
      </main>

      {showReport && report && tab !== 'report' && (
        <div className="report-overlay fade-in-up">
          <div className="report-overlay-card">
            <button className="close-btn" onClick={() => setShowReport(false)}>
              ✕
            </button>
            <h3>📋 上周情绪报告</h3>
            <p>
              峰值情绪：{EMOTIONS.find((e) => e.key === report.peak_emotion)?.emoji}{' '}
              {EMOTIONS.find((e) => e.key === report.peak_emotion)?.label}
            </p>
            <p>平均情绪值：{report.avg_score.toFixed(1)} / 5.0</p>
            <p className="tips-text">💡 {report.tips}</p>
            <button className="primary-btn" onClick={() => setTab('report')}>
              查看完整报告
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
