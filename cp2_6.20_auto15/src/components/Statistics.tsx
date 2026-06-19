import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../api';

const COLORS = ['#1ABC9C', '#2C3E50', '#3498DB', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22'];

interface QuestionStats {
  questionId: string;
  title: string;
  type: string;
  optionCounts?: Record<string, number>;
  avgRating?: number;
  textResponses?: string[];
}

const Statistics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'charts' | 'raw'>('charts');

  const fetchResults = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const data = await api.getResults(id, params);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [id, startDate, endDate]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleExport = useCallback(async () => {
    if (!id) return;
    setExporting(true);
    try {
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const blob = await api.exportCSV(id, params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${id}_results.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  }, [id, startDate, endDate]);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  if (!results) {
    return (
      <div className="container">
        <div className="card"><p>无法加载结果数据</p></div>
      </div>
    );
  }

  const { survey, responses, statistics } = results;

  const computeOptionDistribution = (q: any, stats: any) => {
    const qStat = stats.questions?.find((s: any) => s.question_id === q.id);
    if (!qStat) return [];
    if (q.type === 'radio') {
      return (q.options || []).map((opt: string, i: number) => ({
        name: opt,
        value: qStat.option_counts?.[opt] || 0,
        fill: COLORS[i % COLORS.length],
      }));
    }
    if (q.type === 'checkbox') {
      return (q.options || []).map((opt: string, i: number) => ({
        name: opt,
        value: qStat.option_counts?.[opt] || 0,
        fill: COLORS[i % COLORS.length],
      }));
    }
    return [];
  };

  const computeRatingDistribution = (q: any, stats: any) => {
    const qStat = stats.questions?.find((s: any) => s.question_id === q.id);
    if (!qStat) return [];
    return [1, 2, 3, 4, 5].map((n) => ({
      name: `${n}分`,
      value: qStat.rating_counts?.[n] || 0,
    }));
  };

  const computeRadarData = (questions: any[], stats: any) => {
    const ratingQuestions = questions.filter((q: any) => q.type === 'rating');
    if (ratingQuestions.length === 0) return [];
    return ratingQuestions.map((q: any) => {
      const qStat = stats.questions?.find((s: any) => s.question_id === q.id);
      return {
        subject: q.title || '未命名',
        average: qStat?.avg_rating || 0,
        fullMark: 5,
      };
    });
  };

  const radioCheckboxQuestions = survey.questions.filter((q: any) => q.type === 'radio' || q.type === 'checkbox');
  const ratingQuestions = survey.questions.filter((q: any) => q.type === 'rating');
  const textQuestions = survey.questions.filter((q: any) => q.type === 'text');

  const progressPct = survey.response_count > 0 ? Math.min(100, (survey.response_count / 100) * 100) : 0;

  return (
    <div className="container" style={{ animation: 'fadeIn 300ms ease-out' }}>
      <div className="stats-header">
        <h1>{survey.title} — 数据分析</h1>
        <div className="progress-section">
          <span className="progress-label">已收集 {survey.response_count} 份回答</span>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>开始日期</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="filter-input" />
        </div>
        <div className="filter-group">
          <label>结束日期</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="filter-input" />
        </div>
        <button className="btn btn-secondary" onClick={fetchResults}>筛选</button>
        <button
          className={`btn btn-primary ${exporting ? 'btn-loading' : ''}`}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? <span className="spinner-sm" /> : '📥 导出CSV'}
        </button>
      </div>

      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          图表分析
        </button>
        <button
          className={`tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          原始数据
        </button>
      </div>

      {activeTab === 'charts' && (
        <div className="charts-grid" style={{ animation: 'fadeIn 300ms ease-out' }}>
          {radioCheckboxQuestions.map((q: any) => {
            const barData = computeOptionDistribution(q, statistics);
            const pieData = barData;
            return (
              <div key={q.id} className="chart-card">
                <h3 className="chart-title">{q.title}</h3>
                <div className="chart-row">
                  <div className="chart-half">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={barData} style={{ transition: 'all 300ms ease-out' }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e0e0e0' }}
                          formatter={(value: number) => [`${value} 票`, '数量']}
                        />
                        <Bar
                          dataKey="value"
                          radius={[4, 4, 0, 0]}
                          isAnimationActive
                          animationDuration={600}
                          animationEasing="ease-out"
                        >
                          {barData.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="chart-half">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          isAnimationActive
                          animationDuration={600}
                          animationEasing="ease-out"
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((_: any, i: number) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value} 票`, '数量']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}

          {ratingQuestions.map((q: any) => {
            const ratingData = computeRatingDistribution(q, statistics);
            const qStat = statistics.questions?.find((s: any) => s.question_id === q.id);
            return (
              <div key={q.id} className="chart-card">
                <h3 className="chart-title">{q.title}</h3>
                <p className="chart-subtitle">平均分：{qStat?.avg_rating?.toFixed(1) || '—'}</p>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ratingData} style={{ transition: 'all 300ms ease-out' }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value: number) => [`${value} 人`, '数量']} />
                    <Bar
                      dataKey="value"
                      fill="#1ABC9C"
                      radius={[4, 4, 0, 0]}
                      isAnimationActive
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })}

          {ratingQuestions.length > 1 && (
            <div className="chart-card chart-card-wide">
              <h3 className="chart-title">评分题对比雷达图</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart
                  data={computeRadarData(survey.questions, statistics)}
                  style={{ transition: 'all 300ms ease-out' }}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} />
                  <Radar
                    name="平均分"
                    dataKey="average"
                    stroke="#1ABC9C"
                    fill="#1ABC9C"
                    fillOpacity={0.3}
                    isAnimationActive
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {textQuestions.map((q: any) => {
            const qStat = statistics.questions?.find((s: any) => s.question_id === q.id);
            return (
              <div key={q.id} className="chart-card">
                <h3 className="chart-title">{q.title}</h3>
                <div className="text-responses-list">
                  {(qStat?.text_responses || []).length === 0 && <p className="muted">暂无文本回答</p>}
                  {(qStat?.text_responses || []).map((resp: string, i: number) => (
                    <div key={i} className="text-response-item">"{resp}"</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="raw-data-section" style={{ animation: 'fadeIn 300ms ease-out' }}>
          <div className="card">
            <div className="raw-table-wrapper">
              <table className="raw-table">
                <thead>
                  <tr>
                    <th>提交时间</th>
                    {survey.questions.map((q: any) => (
                      <th key={q.id}>{q.title || '未命名'}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responses.map((resp: any, ri: number) => (
                    <tr key={ri}>
                      <td>{new Date(resp.submitted_at).toLocaleString('zh-CN')}</td>
                      {survey.questions.map((q: any) => (
                        <td key={q.id}>
                          {Array.isArray(resp.answers[q.id]) ? resp.answers[q.id].join(', ') : String(resp.answers[q.id] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
