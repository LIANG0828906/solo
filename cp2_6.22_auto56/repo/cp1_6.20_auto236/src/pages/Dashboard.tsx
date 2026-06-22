import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ContractTemplate, ContractHistory } from '../types';

function Dashboard() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [history, setHistory] = useState<ContractHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, historyRes] = await Promise.all([
          fetch('/api/templates'),
          fetch('/api/history')
        ]);
        const templatesData = await templatesRes.json();
        const historyData = await historyRes.json();
        setTemplates(templatesData);
        setHistory(historyData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTemplateClick = (templateId: string) => {
    navigate(`/editor/${templateId}`);
  };

  const handleHistoryClick = (historyId: string) => {
    navigate(`/history/${historyId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>智能合同生成器</h1>
        <p className="subtitle">选择模板，快速生成专业合同</p>
      </header>

      <section className="templates-section">
        <h2>合同模板</h2>
        <div className="template-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleTemplateClick(template.id)}
            >
              <div className="card-icon">
                <span className="icon-text">📄</span>
              </div>
              <h3>{template.name}</h3>
              <p>{template.description}</p>
              <div className="card-footer">
                <span className="var-count">{template.variables.length} 个变量</span>
                <span className="arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="history-section">
        <h2>历史记录</h2>
        {history.length === 0 ? (
          <div className="empty-history">
            <p>暂无生成记录</p>
            <span className="empty-icon">📋</span>
          </div>
        ) : (
          <div className="history-list">
            {history.map((record) => (
              <div
                key={record.id}
                className="history-item"
                onClick={() => handleHistoryClick(record.id)}
              >
                <div className="history-info">
                  <h4>{record.templateName}</h4>
                  <p className="party-name">甲方：{record.partyAName}</p>
                </div>
                <div className="history-date">
                  <span>{formatDate(record.generatedAt)}</span>
                  <span className="view-text">查看PDF →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
