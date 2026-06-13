import React, { useState, useEffect } from 'react';
import { GradingResult, HistoryRecord, Rule } from './types';
import ReportUploader from './ReportUploader';
import ScoreDashboard from './ScoreDashboard';
import RulesEditor from './RulesEditor';

const App: React.FC = () => {
  const [currentResult, setCurrentResult] = useState<GradingResult | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isGrading, setIsGrading] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [activePanel, setActivePanel] = useState<'upload' | 'rules'>('upload');
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRules();
    fetchHistory();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules');
      if (response.ok) {
        const data = await response.json();
        setRules(data);
      }
    } catch (error) {
      console.error('获取规则失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
    }
  };

  const fetchResultById = async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentResult(data);
        setActiveHistoryId(id);
      }
    } catch (error) {
      console.error('获取评分结果失败:', error);
    }
  };

  const handleUploadComplete = (result: GradingResult) => {
    setCurrentResult(result);
    setActiveHistoryId(result.id);
    fetchHistory();
  };

  const handleRulesChange = (updatedRules: Rule[]) => {
    setRules(updatedRules);
  };

  const handleHistoryClick = (record: HistoryRecord) => {
    if (activeHistoryId === record.id) return;
    fetchResultById(record.id);
  };

  const getScoreColorClass = (percentage: number): string => {
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'orange';
    return 'red';
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="app-container">
      {isGrading && (
        <div className="grading-overlay">
          <div className="grading-spinner" />
          <div style={{ fontSize: '18px', fontWeight: '500' }}>正在智能批改中...</div>
          <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
            请稍候，系统正在分析您的实验报告
          </div>
        </div>
      )}

      <aside className="left-panel">
        <div className="logo">
          <div className="logo-icon">A</div>
          <span>AutoLab</span>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab ${activePanel === 'upload' ? 'active' : ''}`}
            onClick={() => setActivePanel('upload')}
          >
            📤 上传
          </button>
          <button
            className={`nav-tab ${activePanel === 'rules' ? 'active' : ''}`}
            onClick={() => setActivePanel('rules')}
          >
            ⚙️ 规则
          </button>
        </div>

        {activePanel === 'upload' && (
          <ReportUploader
            onUploadComplete={handleUploadComplete}
            setIsGrading={setIsGrading}
          />
        )}

        {activePanel === 'rules' && (
          <RulesEditor
            rules={rules}
            onRulesChange={handleRulesChange}
          />
        )}

        {activePanel === 'upload' && (
          <div className="panel-section">
            <h3 className="section-title">规则信息</h3>
            <div style={{ fontSize: '13px', color: '#666' }}>
              当前共 {rules.length} 条评分规则
            </div>
            <div style={{ 
              background: 'var(--bg-light)', 
              padding: '12px', 
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              color: '#999'
            }}>
              点击"规则"标签页可管理评分规则
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        <div className="center-area">
          {currentResult ? (
            <ScoreDashboard gradingResult={currentResult} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">暂无评分结果</div>
              <div className="empty-state-hint">上传实验报告开始智能批改</div>
            </div>
          )}
        </div>

        <aside className="right-sidebar">
          <h3 className="section-title" style={{ marginBottom: '16px' }}>历史记录</h3>
          <div className="history-list">
            {history.length > 0 ? (
              history.map(record => (
                <div
                  key={record.id}
                  className={`history-item ${activeHistoryId === record.id ? 'active' : ''}`}
                  onClick={() => handleHistoryClick(record)}
                >
                  <div className="history-filename" title={record.filename}>
                    {record.filename}
                  </div>
                  <div className="history-meta">
                    <span>{formatDate(record.timestamp)}</span>
                    <span className={`history-score ${getScoreColorClass(record.percentage)}`}>
                      {record.percentage}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '13px' }}>
                暂无历史记录
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
