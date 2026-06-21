import React, { useState, useEffect, useCallback } from 'react';
import { TrendChart, RadarChart } from '../components/TrendChart';
import { emotionAPI, TrendItem, AnalysisData } from '../api/emotionAPI';

const AnalysisPage: React.FC = () => {
  const [period, setPeriod] = useState(7);
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState<'week' | 'month' | 'all'>('week');

  const fetchTrends = useCallback(async () => {
    try {
      const res = await emotionAPI.getTrends(period);
      setTrendData(res.data);
    } catch {
      setTrendData([]);
    }
  }, [period]);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await emotionAPI.getAnalysis();
      setAnalysis(res.data);
    } catch {
      setAnalysis(null);
    }
  }, []);

  useEffect(() => {
    fetchTrends();
    fetchAnalysis();
  }, [fetchTrends, fetchAnalysis]);

  const handleExport = () => {
    setShowExportModal(true);
  };

  const confirmExport = () => {
    try {
      const now = new Date();
      const endDate = now.toISOString().slice(0, 10);
      let startDate: string;

      if (exportRange === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        startDate = d.toISOString().slice(0, 10);
      } else if (exportRange === 'month') {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 1);
        startDate = d.toISOString().slice(0, 10);
      } else {
        startDate = '2000-01-01';
      }

      const url = emotionAPI.getExportUrl(startDate, endDate);
      const a = document.createElement('a');
      a.href = url;
      a.download = `情绪日志_${exportRange === 'week' ? '最近一周' : exportRange === 'month' ? '最近一月' : '全部'}.csv`;
      a.click();
    } catch {
      alert('导出失败，请重试');
    }
    setShowExportModal(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title">
          <i className="far fa-chart-bar" />
          趋势分析
        </div>
        <button className="btn btn-export" onClick={handleExport}>
          <i className="fas fa-file-export" />
          导出数据
        </button>
      </div>

      <div className="card">
        <div className="card-title">
          <i className="far fa-chart-line" />
          趋势图表
        </div>
        <div className="period-selector">
          {[7, 14, 30].map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}天
            </button>
          ))}
        </div>
        {trendData.length > 0 ? (
          <TrendChart data={trendData} />
        ) : (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>
            <i className="far fa-chart-bar" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
            暂无数据，记录更多心情后即可查看趋势
          </div>
        )}
      </div>

      {analysis && (
        <div className="card">
          <div className="card-title">
            <i className="far fa-calculator" />
            统计摘要
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">平均情绪指数</div>
              <div className="stat-value">{analysis.avg_intensity?.toFixed(2) ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">情绪波动标准差</div>
              <div className="stat-value">{analysis.std_intensity?.toFixed(2) ?? '—'}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">最高情绪日</div>
              <div className="stat-value" style={{ fontSize: 14 }}>
                {analysis.max_day ?? '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">最低情绪日</div>
              <div className="stat-value" style={{ fontSize: 14 }}>
                {analysis.min_day ?? '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">精力与情绪相关系数</div>
              <div className="stat-value">
                {analysis.correlation !== null ? analysis.correlation.toFixed(2) : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <i className="far fa-compass" />
          生活事件关联分析
        </div>
        {analysis && analysis.tag_stats.length > 0 ? (
          <RadarChart tagStats={analysis.tag_stats} />
        ) : (
          <div style={{ textAlign: 'center', color: '#bbb', padding: '40px 0' }}>
            <i className="far fa-compass" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
            暂无标签数据，记录时勾选生活事件标签即可分析
          </div>
        )}
      </div>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              <i className="fas fa-file-export" style={{ marginRight: 8 }} />
              导出情绪数据
            </div>
            <div className="modal-text">选择要导出的时间范围：</div>
            <div className="export-range-select" style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
              {([
                { key: 'week', label: '最近一周' },
                { key: 'month', label: '最近一月' },
                { key: 'all', label: '全部数据' },
              ] as const).map(opt => (
                <button
                  key={opt.key}
                  className={`btn ${exportRange === opt.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setExportRange(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="modal-text">
              导出格式为CSV文件，包含日期、时间、情绪类别、情绪强度、精力值、生活事件标签、文字备注。
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowExportModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={confirmExport}>
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
