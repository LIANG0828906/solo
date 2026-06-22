import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoiceStore, formatCurrency } from '../store/useInvoiceStore';
import InvoiceCard from '../components/InvoiceCard';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, recentInvoices, fetchStats, fetchRecent } = useInvoiceStore();

  useEffect(() => {
    fetchStats();
    fetchRecent();
  }, [fetchStats, fetchRecent]);

  const statCards = [
    {
      label: '当月发票总数',
      value: stats.totalCount,
      icon: '📄',
      bgColor: '#27AE60',
    },
    {
      label: '已收款总额',
      value: formatCurrency(stats.totalPaid),
      icon: '💰',
      bgColor: '#2980B9',
    },
    {
      label: '待收款总额',
      value: formatCurrency(stats.totalPending),
      icon: '⏰',
      bgColor: '#E67E22',
    },
    {
      label: '逾期发票数',
      value: stats.overdueCount,
      icon: '⚠️',
      bgColor: '#E74C3C',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>仪表盘</h1>
        <button
          className="btn-primary"
          onClick={() => navigate('/invoices/new')}
        >
          ➕ 创建发票
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="stat-card"
            style={{ backgroundColor: card.bgColor }}
          >
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{card.label}</p>
              <p className="stat-value">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="recent-section">
        <div className="section-header">
          <h2>最近发票</h2>
          <button
            className="btn-link"
            onClick={() => navigate('/invoices')}
          >
            查看全部 →
          </button>
        </div>

        {recentInvoices.length > 0 ? (
          <div className="recent-grid">
            {recentInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>暂无发票记录</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/invoices/new')}
            >
              创建第一张发票
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
