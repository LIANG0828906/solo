import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ReportData } from '../types';

export default function ReportDashboard() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
    const timer = setInterval(loadReport, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadReport = async () => {
    try {
      const data = await api.getReports();
      setReport(data);
    } catch (e) {
      console.error('加载报表失败', e);
    } finally {
      setLoading(false);
    }
  };

  const metrics = report
    ? [
        {
          icon: '📋',
          label: '今日订单数',
          value: report.totalOrders,
          unit: '单',
          color: '#f59e0b',
        },
        {
          icon: '💰',
          label: '今日总成本',
          value: `¥${report.totalCost.toFixed(2)}`,
          unit: '',
          color: '#6366f1',
        },
        {
          icon: '💵',
          label: '今日总收入',
          value: `¥${report.totalRevenue.toFixed(2)}`,
          unit: '',
          color: '#10b981',
        },
        {
          icon: '📈',
          label: '今日利润',
          value: `¥${report.profit.toFixed(2)}`,
          unit: '',
          color: '#dc2626',
          highlight: report.profit > 0,
        },
      ]
    : [];

  return (
    <div className="page-content">
      <style>{`
        .metrics-grid {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .metric-card {
          width: 220px;
          height: 100px;
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .metric-icon {
          position: absolute;
          top: 12px;
          left: 12px;
          font-size: 20px;
        }
        .metric-value {
          text-align: center;
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-top: 12px;
        }
        .metric-value.highlight {
          color: #10b981;
        }
        .metric-label {
          text-align: center;
          font-size: 12px;
          font-weight: 400;
          color: #6b7280;
        }
        .profit-chart-container {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }
        .chart-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
        }
        .profit-bar-chart {
          display: flex;
          align-items: flex-end;
          gap: 32px;
          height: 200px;
          padding: 0 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .bar-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .bar {
          width: 60px;
          border-radius: 8px 8px 0 0;
          transition: height 0.5s ease-out;
          min-height: 4px;
        }
        .bar-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }
        .bar-value {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
        .refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-left: 12px;
          padding: 6px 12px;
          font-size: 13px;
        }
        @media (max-width: 768px) {
          .metrics-grid {
            flex-direction: column;
          }
          .metric-card {
            width: 100%;
          }
          .profit-bar-chart {
            flex-direction: column;
            align-items: flex-start;
            height: auto;
            gap: 16px;
          }
          .bar-item {
            flex-direction: row;
            width: 100%;
            justify-content: space-between;
          }
          .bar {
            width: 100%;
            height: 24px !important;
            border-radius: 4px;
            min-width: 20px;
          }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          成本与利润概览
        </h1>
        <button className="btn ripple refresh-btn" onClick={loadReport}>
          🔄 刷新
        </button>
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : (
        <>
          <div className="metrics-grid">
            {metrics.map((m, idx) => (
              <div key={idx} className="metric-card">
                <span className="metric-icon">{m.icon}</span>
                <div className={`metric-value ${m.highlight ? 'highlight' : ''}`}>
                  {m.value} <span style={{ fontSize: '14px', fontWeight: 500 }}>{m.unit}</span>
                </div>
                <div className="metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          {report && (
            <div className="profit-chart-container">
              <div className="chart-title">今日财务分布</div>
              <div className="profit-bar-chart">
                <div className="bar-item">
                  <div className="bar-value">¥{report.totalCost.toFixed(2)}</div>
                  <div
                    className="bar"
                    style={{
                      height: `${Math.min(
                        (report.totalCost / Math.max(report.totalRevenue, 1)) * 150,
                        150
                      )}px`,
                      backgroundColor: '#6366f1',
                    }}
                  />
                  <div className="bar-label">总成本</div>
                </div>
                <div className="bar-item">
                  <div className="bar-value">¥{report.totalRevenue.toFixed(2)}</div>
                  <div
                    className="bar"
                    style={{
                      height: `${Math.min(
                        (report.totalRevenue / Math.max(report.totalRevenue, 1)) * 150,
                        150
                      )}px`,
                      backgroundColor: '#10b981',
                    }}
                  />
                  <div className="bar-label">总收入</div>
                </div>
                <div className="bar-item">
                  <div className="bar-value" style={{ color: report.profit >= 0 ? '#10b981' : '#dc2626' }}>
                    ¥{report.profit.toFixed(2)}
                  </div>
                  <div
                    className="bar"
                    style={{
                      height: `${Math.min(
                        (Math.abs(report.profit) / Math.max(report.totalRevenue, 1)) * 150,
                        150
                      )}px`,
                      backgroundColor: report.profit >= 0 ? '#f59e0b' : '#dc2626',
                    }}
                  />
                  <div className="bar-label">利润</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
