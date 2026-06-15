import { useEffect, useState } from 'react';
import { fetchOverviewSummary, fetchOverviewPrediction, OverviewSummary, OverviewPrediction } from '../utils/api';
import BarChart from '../components/BarChart';

export default function Dashboard() {
  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [prediction, setPrediction] = useState<OverviewPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchOverviewSummary(), fetchOverviewPrediction()])
      .then(([s, p]) => {
        setSummary(s);
        setPrediction(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    '¥' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const historyTotal = prediction?.historical.reduce((s, h) => s + h.total, 0) || 0;
  const predTotal = prediction?.predictions.reduce((s, p) => s + p.total, 0) || 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">财务概览</h1>
      </div>

      <div className="projects-grid" style={{ marginBottom: 24 }}>
        <div className="project-card in-progress" style={{ cursor: 'default', minHeight: 0 }}>
          <div className="project-client" style={{ marginTop: 0, opacity: 1, fontSize: 13 }}>累计总收入</div>
          <div className="project-rate" style={{ fontSize: 24 }}>
            {summary ? fmt(summary.totalIncome) : '--'}
          </div>
        </div>
        <div className="project-card completed" style={{ cursor: 'default', minHeight: 0 }}>
          <div className="project-client" style={{ marginTop: 0, opacity: 1, fontSize: 13 }}>过去12个月</div>
          <div className="project-rate" style={{ fontSize: 24 }}>
            {fmt(historyTotal)}
          </div>
        </div>
        <div className="project-card paused" style={{ cursor: 'default', minHeight: 0 }}>
          <div className="project-client" style={{ marginTop: 0, opacity: 1, fontSize: 13 }}>未来3个月预测</div>
          <div className="project-rate" style={{ fontSize: 24 }}>
            {prediction && prediction.predictions.length ? fmt(predTotal) : '--'}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-title">过去12个月收入及未来3个月预测</div>
        {loading && !prediction ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-text">加载图表中...</div>
          </div>
        ) : prediction ? (
          <BarChart historical={prediction.historical} predictions={prediction.predictions} />
        ) : null}
      </div>

      {prediction && prediction.predictions.length > 0 && (
        <div className="chart-container">
          <div className="chart-title">预测明细</div>
          <div className="income-list">
            {prediction.predictions.map((p) => {
              const [y, m] = p.month.split('-');
              return (
                <div className="income-item" style={{ cursor: 'default' }} key={p.month}>
                  <div className="status-indicator pending">📈</div>
                  <div className="income-main">
                    <div className="income-top">
                      <span className="income-project">{y}年{parseInt(m, 10)}月 预测收入</span>
                      <span className="income-amount">{fmt(p.total)}</span>
                    </div>
                    <div className="income-bottom">
                      <span>基于过去6个月线性回归估算</span>
                      <span className="income-status-badge pending">预测</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
