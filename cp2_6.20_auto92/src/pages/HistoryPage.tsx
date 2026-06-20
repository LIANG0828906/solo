import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getEmployeeReports, ReportSummary } from '../api/reportApi';
import { getScoreColor, getScoreLevel } from '../types';
import HealthTrend from '../components/HealthTrend';
import { getReport, ReportWithAnalysis } from '../api/reportApi';

interface HistoryState {
  loading: boolean;
  reports: ReportSummary[];
  selectedReport: ReportWithAnalysis | null;
  error: string | null;
  page: number;
  currentMetric: string;
}

type HistoryAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_DONE'; reports: ReportSummary[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_METRIC'; metric: string }
  | { type: 'SELECT_REPORT'; report: ReportWithAnalysis | null };

const PAGE_SIZE = 10;
const METRICS = ['空腹血糖', '总胆固醇', '收缩压', 'BMI'];

const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_DONE':
      return { ...state, loading: false, reports: action.reports };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'SET_PAGE':
      return { ...state, page: action.page };
    case 'SET_METRIC':
      return { ...state, currentMetric: action.metric };
    case 'SELECT_REPORT':
      return { ...state, selectedReport: action.report };
    default:
      return state;
  }
};

const initialState: HistoryState = {
  loading: false,
  reports: [],
  selectedReport: null,
  error: null,
  page: 1,
  currentMetric: METRICS[0],
};

const HistoryPage: React.FC = function HistoryPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const [empIdInput, setEmpIdInput] = useState(employeeId || '');
  const [searchedId, setSearchedId] = useState(employeeId || '');
  const [state, dispatch] = useReducer(historyReducer, initialState);
  const { loading, reports, selectedReport, error, page, currentMetric } = state;

  useEffect(() => {
    if (!searchedId) return;
    let active = true;
    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      try {
        const data = await getEmployeeReports(searchedId);
        if (active) dispatch({ type: 'LOAD_DONE', reports: data });
      } catch {
        if (active) dispatch({ type: 'LOAD_ERROR', error: '未找到该员工的体检记录' });
      }
    };
    load();
    return () => { active = false; };
  }, [searchedId]);

  const handleSearch = () => {
    if (!empIdInput.trim()) return;
    setSearchedId(empIdInput.trim());
    navigate(`/history/${empIdInput.trim()}`);
    dispatch({ type: 'SET_PAGE', page: 1 });
  };

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return reports.slice(start, start + PAGE_SIZE);
  }, [reports, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(reports.length / PAGE_SIZE)),
    [reports.length]
  );

  const setPage = useCallback((p: number) => dispatch({ type: 'SET_PAGE', page: p }), []);
  const setMetric = useCallback((m: string) => dispatch({ type: 'SET_METRIC', metric: m }), []);

  const handleSelectReport = useCallback(async (reportId: string) => {
    try {
      const rep = await getReport(reportId);
      dispatch({ type: 'SELECT_REPORT', report: rep });
    } catch {
      console.error('加载报告详情失败');
    }
  }, []);

  const combinedTrends = useMemo(() => {
    if (!selectedReport) return {} as Record<string, { date: string; value: number }[]>;
    return selectedReport.trends;
  }, [selectedReport]);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>📋 历史体检记录</h1>
          <div style={{ marginTop: 4, color: '#718096', fontSize: 14 }}>
            查询员工历史体检报告及趋势
          </div>
        </div>
        <div className="page-links">
          <Link to="/">返回录入</Link>
          <Link to="/hr">HR 概览</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title">🔍 员工查询</h3>
        <div style={{ display: 'flex', gap: 12, maxWidth: 480 }}>
          <input
            type="text"
            placeholder="请输入员工编号，如 EMP0001"
            value={empIdInput}
            onChange={(e) => setEmpIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1 }}
          />
          <button className="primary" onClick={handleSearch}>查询</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#868e96' }}>
          提示：可使用模拟数据员工编号，如 EMP0001 ~ EMP0050
        </div>
      </div>

      {loading && (
        <div className="card">
          <div className="loading-skeleton" style={{ height: 320 }} />
        </div>
      )}

      {error && searchedId && (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ color: '#e53e3e', fontSize: 16, marginBottom: 12 }}>{error}</div>
          <div style={{ fontSize: 13, color: '#718096' }}>请检查员工编号是否正确</div>
        </div>
      )}

      {!loading && !error && searchedId && reports.length > 0 && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 className="section-title">📈 趋势分析</h3>
            {selectedReport ? (
              <HealthTrend
                trends={combinedTrends}
                selectedMetric={currentMetric}
                onMetricChange={setMetric}
                highlightDate={selectedReport.report_date}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>
                点击下方表格中的记录查看趋势详情
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="section-title">
              体检记录列表
              <span style={{ marginLeft: 12, fontSize: 14, fontWeight: 400, color: '#718096' }}>
                共 {reports.length} 条记录
              </span>
            </h3>
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
                {paginatedReports.map((r, idx) => {
                  const globalIdx = (page - 1) * PAGE_SIZE + idx;
                  const isSelected = selectedReport?.report_id === r.id;
                  return (
                    <tr
                      key={r.id}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#ebf8ff' : undefined,
                      }}
                      onClick={() => handleSelectReport(r.id)}
                    >
                      <td>{r.date}</td>
                      <td style={{ color: getScoreColor(r.overall_score), fontWeight: 600 }}>
                        {r.overall_score}
                      </td>
                      <td>
                        <span className={`badge ${r.overall_score >= 90 ? 'badge-success' : r.overall_score >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                          {getScoreLevel(r.overall_score)}
                        </span>
                      </td>
                      <td>
                        {r.key_abnormalities.length > 0
                          ? r.key_abnormalities.join('、')
                          : <span style={{ color: '#a0aec0' }}>无</span>}
                      </td>
                      <td>
                        <Link to={`/result/${r.id}`}>
                          <button
                            className="primary"
                            style={{ padding: '4px 12px', fontSize: 12 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            查看详情
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {reports.length > PAGE_SIZE && (
              <div className="pagination">
                <button className="secondary" onClick={() => setPage(1)} disabled={page === 1}>首页</button>
                <button className="secondary" onClick={() => setPage(page - 1)} disabled={page === 1}>上一页</button>
                <span style={{ fontSize: 13, color: '#718096' }}>{page} / {totalPages}</span>
                <button className="secondary" onClick={() => setPage(page + 1)} disabled={page === totalPages}>下一页</button>
                <button className="secondary" onClick={() => setPage(totalPages)} disabled={page === totalPages}>末页</button>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !error && !searchedId && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, color: '#4a5568', marginBottom: 8 }}>请输入员工编号查询历史记录</div>
          <div style={{ fontSize: 13, color: '#868e96' }}>支持分页浏览、趋势图查看、详情跳转</div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
