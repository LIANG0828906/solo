import React, { useEffect, useReducer, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getHROverview, HROverviewData, MetricDistribution, HighRiskEmployee } from '../api/reportApi';
import { getScoreColor, getScoreLevel } from '../types';

interface HRState {
  loading: boolean;
  data: HROverviewData | null;
  error: string | null;
  page: number;
}

type HRAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_DONE'; data: HROverviewData }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'SET_PAGE'; page: number };

const HR_PAGE_SIZE = 10;

const hrReducer = (s: HRState, a: HRAction): HRState => {
  switch (a.type) {
    case 'LOAD_START': return { ...s, loading: true, error: null };
    case 'LOAD_DONE': return { ...s, loading: false, data: a.data };
    case 'LOAD_ERROR': return { ...s, loading: false, error: a.error };
    case 'SET_PAGE': return { ...s, page: a.page };
    default: return s;
  }
};

const HR_INITIAL: HRState = { loading: false, data: null, error: null, page: 1 };

const HR_CREDENTIALS = { username: 'hr', password: 'admin123' };

const MetricBarChart: React.FC<{ data: MetricDistribution[] }> = React.memo(function MetricBarChart({ data }) {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" vertical={false} />
          <XAxis
            dataKey="metric"
            tick={{ fill: '#4a5568', fontSize: 12 }}
            axisLine={{ stroke: '#e2e8f0' }}
            interval={0}
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fill: '#718096', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: '#f7fafc' }}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                return (
                  <div style={{
                    background: 'white', padding: '10px 14px', borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0',
                  }}>
                    <div style={{ fontWeight: 600 }}>{payload[0].payload.metric}</div>
                    <div style={{ color: '#e53e3e', fontWeight: 500 }}>
                      异常人数：{payload[0].value}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="count"
            fill="#e53e3e"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
            isAnimationActive={true}
            animationDuration={500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

const HROverview: React.FC = function HROverview() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginErr, setLoginErr] = useState('');
  const [state, dispatch] = useReducer(hrReducer, HR_INITIAL);
  const { loading, data, error, page } = state;

  const doLogin = () => {
    if (loginForm.username === HR_CREDENTIALS.username && loginForm.password === HR_CREDENTIALS.password) {
      setLoggedIn(true);
      setLoginErr('');
    } else {
      setLoginErr('账号或密码错误');
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    let active = true;
    const load = async () => {
      dispatch({ type: 'LOAD_START' });
      try {
        const d = await getHROverview();
        if (active) dispatch({ type: 'LOAD_DONE', data: d });
      } catch {
        if (active) dispatch({ type: 'LOAD_ERROR', error: '加载HR数据失败' });
      }
    };
    load();
    return () => { active = false; };
  }, [loggedIn]);

  const sortedHighRisk = useMemo<HighRiskEmployee[]>(() => {
    if (!data) return [];
    return [...data.high_risk_employees].sort((a, b) => a.score - b.score);
  }, [data]);

  const pagedList = useMemo(() => {
    const start = (page - 1) * HR_PAGE_SIZE;
    return sortedHighRisk.slice(start, start + HR_PAGE_SIZE);
  }, [sortedHighRisk, page]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedHighRisk.length / HR_PAGE_SIZE)),
    [sortedHighRisk.length]
  );

  const setPage = useCallback((p: number) => dispatch({ type: 'SET_PAGE', page: p }), []);

  if (!loggedIn) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1>HR 健康管理后台</h1>
          <div className="page-links"><Link to="/">员工入口</Link></div>
        </div>
        <div className="card login-box">
          <h3 className="section-title" style={{ justifyContent: 'center' }}>🔐 管理员登录</h3>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              placeholder="hr"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              placeholder="admin123"
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            />
          </div>
          {loginErr && <span className="error-text" style={{ marginBottom: 12, display: 'block' }}>{loginErr}</span>}
          <button className="primary" style={{ width: '100%' }} onClick={doLogin}>登录</button>
          <div style={{ marginTop: 12, fontSize: 12, color: '#868e96', textAlign: 'center' }}>
            测试账号：hr / admin123
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fade-in">
        <div className="stat-cards">
          {[0, 1, 2].map((i) => (
            <div key={i} className="loading-skeleton" style={{ height: 120, borderRadius: 12 }} />
          ))}
        </div>
        <div className="card"><div className="loading-skeleton" style={{ height: 280 }} /></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ color: '#e53e3e', fontSize: 18, marginBottom: 16 }}>{error || '加载失败'}</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>🏢 HR 部门健康概览</h1>
          <div style={{ marginTop: 4, color: '#718096', fontSize: 14 }}>
            全公司员工健康数据统计与分析
          </div>
        </div>
        <div className="page-links">
          <Link to="/">员工入口</Link>
          <button
            className="secondary"
            style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => { setLoggedIn(false); }}
          >
            退出
          </button>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card stat-card-1">
          <h3>员工总数</h3>
          <div className="stat-value">{data.total_employees}</div>
          <div style={{ marginTop: 4, fontSize: 13, opacity: 0.9 }}>累计体检覆盖</div>
        </div>
        <div className="stat-card stat-card-2">
          <h3>平均综合评分</h3>
          <div className="stat-value">{data.avg_score.toFixed(1)}</div>
          <div style={{ marginTop: 4, fontSize: 13, opacity: 0.9 }}>
            等级：{getScoreLevel(Math.round(data.avg_score))}
          </div>
        </div>
        <div className="stat-card stat-card-3">
          <h3>高风险员工数</h3>
          <div className="stat-value">{data.high_risk_count}</div>
          <div style={{ marginTop: 4, fontSize: 13, opacity: 0.9 }}>
            占比：{data.total_employees ? ((data.high_risk_count / data.total_employees) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="section-title">📊 异常指标分布</h3>
        <MetricBarChart data={data.metric_distribution} />
      </div>

      <div className="card">
        <h3 className="section-title">⚠️ 高风险员工列表（评分 &lt; 60）</h3>
        <table className="table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>部门</th>
              <th>综合评分</th>
              <th>等级</th>
              <th>主要异常指标</th>
            </tr>
          </thead>
          <tbody>
            {pagedList.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#a0aec0' }}>
                  暂无高风险员工
                </td>
              </tr>
            )}
            {pagedList.map((emp, idx) => (
              <tr key={idx} className="high-risk">
                <td style={{ fontWeight: 600 }}>{emp.name}</td>
                <td>{emp.department}</td>
                <td style={{ color: getScoreColor(emp.score), fontWeight: 700 }}>{emp.score}</td>
                <td>
                  <span className="badge badge-danger">{getScoreLevel(emp.score)}</span>
                </td>
                <td>
                  {emp.abnormalities.length > 0
                    ? emp.abnormalities.map((a) => (
                        <span key={a} className="badge badge-danger" style={{ marginRight: 6, marginBottom: 4 }}>
                          {a}
                        </span>
                      ))
                    : <span style={{ color: '#a0aec0' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedHighRisk.length > HR_PAGE_SIZE && (
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

export default HROverview;
