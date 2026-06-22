import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ReportData, WeightMultipliers, Dimension } from '../types';
import RadarChart from '../components/RadarChart';
import WeightSlider from '../components/WeightSlider';
import HistoryList from '../components/HistoryList';
import { dataService } from '../DataService';
import '../styles/ResultPage.css';

const ResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [historyReports, setHistoryReports] = useState<ReportData[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<ReportData | null>(null);
  const [weightMultipliers, setWeightMultipliers] = useState<WeightMultipliers>({});
  const [loading, setLoading] = useState(true);
  const [useWeighted, setUseWeighted] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [reportData, historyData] = await Promise.all([
        dataService.getReport(id),
        dataService.getHistoryReports(id),
      ]);
      setReport(reportData);
      setHistoryReports(historyData);

      const multipliers: WeightMultipliers = {};
      reportData.dimensions.forEach((dim: Dimension) => {
        multipliers[dim.id] = 1;
      });
      setWeightMultipliers(multipliers);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWeightChange = (dimensionId: string, value: number) => {
    setWeightMultipliers(prev => ({
      ...prev,
      [dimensionId]: value,
    }));
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleSaveReport = async () => {
    if (!id) return;
    try {
      await dataService.saveReportToHistory(id);
      const historyData = await dataService.getHistoryReports(id);
      setHistoryReports(historyData);
      alert('报告已保存到历史记录');
    } catch (error) {
      console.error('保存报告失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="result-page">
        <div className="loading-state">加载中...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="result-page">
        <div className="error-state">
          <p>加载报告失败</p>
          <button className="back-btn" onClick={handleBack}>返回首页</button>
        </div>
      </div>
    );
  }

  const overallScore = report.dimensions.length > 0
    ? Object.values(report.averages).reduce((a, b) => a + b, 0) / report.dimensions.length
    : 0;

  const diffData = selectedHistory
    ? dataService.calculateDiff(report, selectedHistory)
    : null;

  return (
    <div className="result-page">
      <div className="result-header">
        <button className="back-btn" onClick={handleBack}>
          ← 返回首页
        </button>
        <div className="result-header__actions">
          <button className="action-btn" onClick={handleRefresh}>
            刷新数据
          </button>
          <button className="action-btn action-btn--primary" onClick={handleSaveReport}>
            保存为历史报告
          </button>
        </div>
      </div>

      <div className="result-title">
        <h1>{report.templateName}</h1>
        <div className="result-stats">
          <div className="stat-item">
            <span className="stat-value">{report.totalFeedbacks}</span>
            <span className="stat-label">份反馈</span>
          </div>
          <div className="stat-item stat-item--score">
            <span className="stat-value">{overallScore.toFixed(1)}</span>
            <span className="stat-label">综合评分</span>
          </div>
        </div>
      </div>

      <div className="result-content">
        <div className="result-main">
          <div className="radar-section glass-card">
            <div className="section-header">
              <h2>雷达图分析</h2>
              <div className="toggle-weight">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={useWeighted}
                    onChange={e => setUseWeighted(e.target.checked)}
                  />
                  <span>显示加权分数</span>
                </label>
              </div>
            </div>
            <div className="radar-chart-wrapper">
              <RadarChart
                report={report}
                weightMultipliers={weightMultipliers}
                historyReport={selectedHistory}
                useWeighted={useWeighted}
              />
            </div>

            {diffData && (
              <div className="diff-panel">
                <h3>与历史报告对比</h3>
                <div className="diff-list">
                  {report.dimensions.map(dim => (
                    <div key={dim.id} className="diff-item">
                      <span className="diff-name">{dim.name}</span>
                      <span
                        className={`diff-value ${
                          (diffData[dim.id] || 0) > 0
                            ? 'diff-value--up'
                            : (diffData[dim.id] || 0) < 0
                            ? 'diff-value--down'
                            : ''
                        }`}
                      >
                        {(diffData[dim.id] || 0) > 0 ? '+' : ''}
                        {(diffData[dim.id] || 0).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="dimensions-section glass-card">
            <h2>维度详情</h2>
            <div className="dim-detail-list">
              {report.dimensions.map((dim, index) => {
                const avg = report.averages[dim.id] || 0;
                const weighted = useWeighted
                  ? dataService.calculateWeightedScores(
                      report.averages,
                      report.dimensions,
                      weightMultipliers
                    )[dim.id] || 0
                  : avg;

                return (
                  <div
                    key={dim.id}
                    className="dim-detail-item"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="dim-detail-header">
                      <span className="dim-detail-name">{dim.name}</span>
                      <span className="dim-detail-score">
                        {avg.toFixed(1)}
                        {useWeighted && (
                          <span className="dim-weighted-score">
                            → {weighted.toFixed(1)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="dim-progress-bar">
                      <div
                        className="dim-progress-fill"
                        style={{ width: `${avg * 10}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="result-sidebar">
          <div className="sidebar-section glass-card">
            <WeightSlider
              dimensions={report.dimensions}
              multipliers={weightMultipliers}
              onChange={handleWeightChange}
            />
          </div>

          <div className="sidebar-section glass-card">
            <HistoryList
              reports={historyReports}
              selectedId={selectedHistory?.id || null}
              onSelect={setSelectedHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
