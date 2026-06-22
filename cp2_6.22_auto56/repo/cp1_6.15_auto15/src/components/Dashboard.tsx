import React from 'react';
import { useAppContext } from '../App';
import DonutChart from './DonutChart';
import type { HealthStatus } from '../types';
import './Dashboard.css';

const statusLabels: Record<HealthStatus, string> = {
  healthy: '健康',
  normal: '一般',
  attention: '需要关注'
};

const statusEmojis: Record<HealthStatus, string> = {
  healthy: '💚',
  normal: '💛',
  attention: '🧡'
};

const Dashboard: React.FC = () => {
  const { plants, toggleDashboard, setFilterStatus, filterStatus } = useAppContext();

  const healthCounts = React.useMemo(() => {
    const counts: Record<HealthStatus, number> = {
      healthy: 0,
      normal: 0,
      attention: 0
    };
    
    plants.forEach(plant => {
      counts[plant.healthStatus]++;
    });
    
    return counts;
  }, [plants]);

  const totalPlants = plants.length;

  const handleSliceClick = (status: HealthStatus) => {
    if (filterStatus === status) {
      setFilterStatus(null);
    } else {
      setFilterStatus(status);
    }
    toggleDashboard();
  };

  const getStatusPercentage = (status: HealthStatus) => {
    if (totalPlants === 0) return 0;
    return Math.round((healthCounts[status] / totalPlants) * 100);
  };

  return (
    <>
      <div 
        className="dashboard-overlay"
        onClick={toggleDashboard}
      />
      <div className="dashboard-panel glass-card animate-slide-in-right">
        <div className="dashboard-header">
          <h2 className="dashboard-title handwriting">📊 健康统计</h2>
          <button 
            className="dashboard-close"
            onClick={toggleDashboard}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="dashboard-content">
          <div className="chart-container">
            <DonutChart 
              data={[
                { value: healthCounts.healthy, color: 'var(--color-healthy)', status: 'healthy' as HealthStatus },
                { value: healthCounts.normal, color: 'var(--color-normal)', status: 'normal' as HealthStatus },
                { value: healthCounts.attention, color: 'var(--color-attention)', status: 'attention' as HealthStatus }
              ]}
              onSliceClick={handleSliceClick}
              selectedStatus={filterStatus}
            />
            <div className="chart-center">
              <div className="total-number">{totalPlants}</div>
              <div className="total-label">株植物</div>
            </div>
          </div>

          <div className="status-list">
            {(Object.keys(healthCounts) as HealthStatus[]).map(status => (
              <button
                key={status}
                className={`status-item ${filterStatus === status ? 'active' : ''}`}
                onClick={() => handleSliceClick(status)}
              >
                <div className="status-left">
                  <span className="status-emoji">{statusEmojis[status]}</span>
                  <span className="status-name">{statusLabels[status]}</span>
                </div>
                <div className="status-right">
                  <span className="status-count">{healthCounts[status]} 株</span>
                  <span className="status-percentage">({getStatusPercentage(status)}%)</span>
                </div>
              </button>
            ))}
          </div>

          <div className="dashboard-tips">
            <p className="tips-title">💡 小贴士</p>
            <p className="tips-text">
              {healthCounts.attention > 0 
                ? `有 ${healthCounts.attention} 株植物需要关注，记得及时检查哦~`
                : healthCounts.normal > 0
                ? '部分植物状态一般，可以适当增加光照或浇水。'
                : '太棒了！所有植物都很健康，继续保持！'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
