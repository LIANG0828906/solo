import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getSurveyStats } from '../api';
import { StatsData } from '../types';

const COLORS = ['#00BCD4', '#546E7A', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#2196F3', '#FFC107'];

export default function ResponseView() {
  const { id } = useParams();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const updateTimeoutRef = useRef<number>();

  useEffect(() => {
    loadData();
    initWebSocket();
    return () => {
      wsRef.current?.close();
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    };
  }, [id]);

  async function loadData() {
    try {
      const stats = await getSurveyStats(id!);
      setData(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function initWebSocket() {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', surveyId: id }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'new_response') {
          setUpdating(true);
          if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
          updateTimeoutRef.current = window.setTimeout(async () => {
            await loadData();
            setUpdating(false);
          }, 100);
        }
      } catch (err) {
        console.error('WS message error:', err);
      }
    };
  }

  function getSingleData(questionId: string, options: string[]) {
    const counts = options.map(opt => ({ name: opt, value: 0 }));
    for (const a of data!.answers) {
      if (a.question_id === questionId) {
        const idx = options.indexOf(a.answer);
        if (idx >= 0) counts[idx].value++;
      }
    }
    return counts;
  }

  function getMultipleData(questionId: string, options: string[]) {
    const counts = options.map(opt => ({ name: opt, count: 0 }));
    for (const a of data!.answers) {
      if (a.question_id === questionId) {
        try {
          const selected: string[] = JSON.parse(a.answer);
          for (const s of selected) {
            const idx = options.indexOf(s);
            if (idx >= 0) counts[idx].count++;
          }
        } catch { /* ignore */ }
      }
    }
    return counts;
  }

  function getTextAnswers(questionId: string) {
    return data!.answers
      .filter(a => a.question_id === questionId && a.answer)
      .map(a => a.answer);
  }

  if (loading) {
    return <div className="page-container"><div className="card" style={{ textAlign: 'center', padding: 48 }}>加载中...</div></div>;
  }

  if (!data) {
    return <div className="page-container"><div className="card" style={{ textAlign: 'center', padding: 48 }}>数据加载失败</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">数据统计 - {data.survey.title}</h1>
          <p className="page-subtitle">
            共收集 <strong style={{ color: 'var(--accent)' }}>{data.count}</strong> 份答卷
            {updating && <span style={{ marginLeft: 12, color: 'var(--accent)', animation: 'pulse 1s infinite' }}>● 实时更新中</span>}
          </p>
        </div>
        <div className="header-actions">
          <Link to={`/admin/share/${id}`} className="btn btn-secondary">分享问卷</Link>
          <Link to={`/admin/editor/${id}`} className="btn btn-secondary">编辑问卷</Link>
          <Link to="/admin/surveys" className="btn-secondary btn">返回列表</Link>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div className={`card fade-in chart-container ${updating ? 'chart-updating' : ''}`} style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(0, 188, 212, 0.08)', borderRadius: 12 }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{data.count}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>答卷总数</div>
            </div>
            <div style={{ textAlign: 'center', padding: 16, background: 'rgba(84, 110, 122, 0.08)', borderRadius: 12 }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--primary)' }}>{data.survey.questions.length}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>题目数量</div>
            </div>
            {data.survey.start_time && (
              <div style={{ textAlign: 'center', padding: 16, background: 'rgba(76, 175, 80, 0.08)', borderRadius: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#4CAF50' }}>
                  {new Date(data.survey.start_time).toLocaleString('zh-CN')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>开始时间</div>
              </div>
            )}
            {data.survey.end_time && (
              <div style={{ textAlign: 'center', padding: 16, background: 'rgba(255, 152, 0, 0.08)', borderRadius: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#FF9800' }}>
                  {new Date(data.survey.end_time).toLocaleString('zh-CN')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>结束时间</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 20 }}>
          {data.survey.questions.map((q, idx) => {
            const baseDelay = idx * 50;
            if (q.type === 'single' && q.options) {
              const chartData = getSingleData(q.id, q.options);
              const total = chartData.reduce((s, d) => s + d.value, 0);
              return (
                <div key={q.id} className={`card fade-in chart-container ${updating ? 'chart-updating' : ''}`} style={{ animationDelay: `${baseDelay}ms` }}>
                  <h3 style={{ color: 'var(--primary)', marginBottom: 4, fontSize: 15 }}>Q{idx + 1}. {q.title}</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: 12, marginBottom: 16 }}>单选题 · 共 {total} 人作答</p>
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => total > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                          outerRadius={90}
                          dataKey="value"
                          isAnimationActive={true}
                          animationDuration={300}
                        >
                          {chartData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v} 人 (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`, '选择人数']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }
            if (q.type === 'multiple' && q.options) {
              const chartData = getMultipleData(q.id, q.options);
              return (
                <div key={q.id} className={`card fade-in chart-container ${updating ? 'chart-updating' : ''}`} style={{ animationDelay: `${baseDelay}ms` }}>
                  <h3 style={{ color: 'var(--primary)', marginBottom: 4, fontSize: 15 }}>Q{idx + 1}. {q.title}</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: 12, marginBottom: 16 }}>多选题</p>
                  <div style={{ width: '100%', height: Math.max(200, chartData.length * 50 + 80) }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => [`${v} 次`, '被选次数']} />
                        <Bar dataKey="count" fill="#00BCD4" radius={[0, 6, 6, 0]} isAnimationActive={true} animationDuration={300} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            }
            if (q.type === 'text') {
              const answers = getTextAnswers(q.id);
              return (
                <div key={q.id} className={`card fade-in chart-container ${updating ? 'chart-updating' : ''}`} style={{ animationDelay: `${baseDelay}ms` }}>
                  <h3 style={{ color: 'var(--primary)', marginBottom: 4, fontSize: 15 }}>Q{idx + 1}. {q.title}</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: 12, marginBottom: 16 }}>文本题 · 共 {answers.length} 条回答</p>
                  <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 8 }}>
                    {answers.length === 0 ? (
                      <p style={{ color: 'var(--text-light)', fontSize: 13, fontStyle: 'italic' }}>暂无回答</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {answers.map((ans, i) => (
                          <div
                            key={i}
                            className="fade-in"
                            style={{
                              padding: '12px 14px',
                              background: 'rgba(0, 188, 212, 0.05)',
                              borderRadius: 10,
                              borderLeft: '3px solid var(--accent)',
                              fontSize: 13,
                              lineHeight: 1.6,
                              color: 'var(--text)',
                              animationDelay: `${i * 20}ms`
                            }}
                          >
                            {ans}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
