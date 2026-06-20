import React, { useEffect, useReducer, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getReport,
  getEmployeeReports,
  ReportWithAnalysis,
  ReportSummary,
} from '../api/reportApi';
import { getScoreColor, getScoreLevel, METRIC_OPTIONS } from '../types';
import ScoreRing from './ScoreRing';
import RadarChart from './RadarChart';
import HealthTrend from './HealthTrend';
import SuggestionPanel from './SuggestionPanel';

interface State {
  loading: boolean;
  report: ReportWithAnalysis | null;
  history: ReportSummary[];
  selectedHistoryIdx: number;
  currentMetric: string;
  page: number;
  error: string | null;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_DONE'; report: ReportWithAnalysis; history: ReportSummary[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'SET_METRIC'; metric: string }
  | { type: 'SET_HISTORY_IDX'; idx: number }
  | { type: 'SET_PAGE'; page: number };

const initialState: State = {
  loading: true,
  report: null,
  history: [],
  selectedHistoryIdx: 0,
  currentMetric: METRIC_OPTIONS[0].key,
  page: 1,
  error: null,
};

const PAGE_SIZE = 10;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_DONE':
      return { ...state, loading: false, report: action.report, history: action.history };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'SET_METRIC':
      return { ...state, currentMetric: action.metric };
    case 'SET_HISTORY_IDX':
      return { ...state, selectedHistoryIdx: action.idx };
    case 'SET_PAGE':
      return { ...state, page: action.page };
    default:
      return state;
  }
}

const ReportDashboard: React.FC = function ReportDashboard() {
  const { id } = useParams<{ id: string }>();
  const [state, dispatch] = useReducer(reducer, initialState);
  const { loading, report, history, selectedHistoryIdx, currentMetric, page, error } = state;

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      try {
        const rep = await getReport(id);
        const his = await getEmployeeReports(rep.employee_id);
        if (active) dispatch({ type: 'LOAD_DONE', report: rep, history: his });
      } catch (e) {
        if (active) dispatch({ type: 'LOAD_ERROR', error: '加载失败' });
      }
    };
    load();
    return () => { active = false; };
  }, [id]);

  const highlightDate = useMemo(() => {
    if (history[selectedHistoryIdx]) return history[selectedHistoryIdx].date;
    return report?.report_date;
  }, [history, selectedHistoryIdx, report]);

  const paginatedHistory = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return history.slice(start, start + PAGE_SIZE);
  }, [history, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(history.length / PAGE_SIZE)),
    [history.length]
  );

  const setMetric = useCallback((m: string) => dispatch({ type: 'SET_METRIC', metric: m }), []);
  const setIdx = useCallback((i: number) => dispatch({ type: 'SET_HISTORY_IDX', idx: i }), []);
  const setPage = useCallback((p: number) => dispatch({ type: 'SET_PAGE', page: p }), []);

  if (loading) {
    return (
      <div className="fade-in">
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="loading-skeleton" style={{ height: 180 }} />
        </div>
        <div className="grid-3">
          <div className="card"><div className="loading-skeleton" style={{ height: 320 }} /></div>
          <div className="card"><div className="loading-skeleton" style={{ height: 320 }} /></div>
          <div className="card"><div className="loading-skeleton" style={{ height: 320 }} /></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ color: '#e53e3e', fontSize: 18, marginBottom: 16 }}>{error || '数据未找到'}</div>
        <Link to="/"><button className="primary">返回首页</button></Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>个人健康分析报告</h1>
          <div style={{ marginTop: 4, color: '#718096', fontSize: 14 }}>
            {report.employee_name}（{report.employee_id}） · {report.department} · 报告日期：{report.report_date}
          </div>
        </div>
        <div className="page-links">
          <Link to="/">返回录入</Link>
          <Link to="/hr">HR 概览</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, alignItems: 'center' }}>
          <ScoreRing score={report.overall_score} size={200} />
          <div>
            <div className="score-label" style={{ textAlign: 'left', color: getScoreColor(report.overall_score) }}>
              综合健康评分 · {getScoreLevel(report.overall_score)}
            </div>
            <div style={{ color: '#4a5568', fontSize: 14, marginTop: 8, lineHeight: 1.8 }}>
              基于您本次体检的 {Object.keys(report.risk_scores).length} 个健康维度综合评估。
              {report.overall_score >= 90 && ' 各项指标优秀，请继续保持健康的生活方式！'}
              {report.overall_score >= 70 && report.overall_score < 90 && ' 整体良好，建议关注部分异常指标并及时调整。'}
              {report.overall_score >= 60 && report.overall_score < 70 && ' 部分指标存在风险，建议尽快改善生活习惯并复查。'}
              {report.overall_score < 60 && ' 存在较高健康风险，强烈建议尽早就医并制定改善计划。'}
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><span style={{ color: '#718096', fontSize: 13 }}>BMI：</span><span style={{ fontWeight: 600 }}>
                {(report.basic_info.weight / Math.pow(report.basic_info.height / 100, 2)).toFixed(1)}
              </span></div>
              <div><span style={{ color: '#718096', fontSize: 13 }}>年龄：</span><span style={{ fontWeight: 600 }}>{report.basic_info.age}</span></div>
              <div><span style={{ color: '#718096', fontSize: 13 }}>性别：</span><span style={{ fontWeight: 600 }}>{report.basic_info.gender}</span></div>
              <div><span style={{ color: '#718096', fontSize: 13 }}>建议数：</span><span style={{ fontWeight: 600, color: '#2b6cb0' }}>{report.suggestions.length}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <h3 className="section-title">🛡️ 风险雷达图</h3>
          <RadarChart riskScores={report.risk_scores} />
        </div>
        <div className="card">
          <h3 className="section-title">📈 健康趋势</h3>
          <HealthTrend
            trends={report.trends}
            selectedMetric={currentMetric}
            onMetricChange={setMetric}
            highlightDate={highlightDate}
          />
        </div>
        <div className="card">
          <h3 className="section-title">💡 改善建议</h3>
          <SuggestionPanel suggestions={report.suggestions} />
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">📋 历史记录</h3>
        <table className="table">
          <thead>
            <tr>
              <th>报告日期</th>
              <th>综合评分</th>
              <th>等级</th>
              <th>关键异常指标</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedHistory.map((h, i) => {
              const globalIdx = (page - 1) * PAGE_SIZE + i;
              const isActive = globalIdx === selectedHistoryIdx;
              return (
                <tr
                  key={h.id}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#ebf8ff' : undefined,
                  }}
                  onClick={() => setIdx(globalIdx)}
                >
                  <td>{h.date}</td>
                  <td style={{ color: getScoreColor(h.overall_score), fontWeight: 600 }}>{h.overall_score}</td>
                  <td>
                    <span className={`badge ${h.overall_score >= 90 ? 'badge-success' : h.overall_score >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                      {getScoreLevel(h.overall_score)}
                    </span>
                  </td>
                  <td>
                    {h.key_abnormalities.length > 0
                      ? h.key_abnormalities.join('、')
                      : <span style={{ color: '#a0aec0' }}>无</span>}
                  </td>
                  <td>
                    <button
                      className="primary"
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      查看
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {history.length > PAGE_SIZE && (
          <div className="pagination">
            <button className="secondary" onClick={() => setPage(1)} disabled={page === 1}>首页</button>
            <button className="secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>上一页</button>
            <span style={{ fontSize: 13, color: '#718096' }}>{page} / {totalPages}</span>
            <button className="secondary" onClick={() => setPage(page + 1)} disabled={page === totalPages}>下一页</button>
            <button className="secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>末页</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDashboard;
