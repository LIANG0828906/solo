import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CardGrid from './CardGrid';
import ChartPanel from './ChartPanel';
import VersionPanel from './VersionPanel';

interface AdVersion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  trafficPercentage: number;
  createdAt: number;
  history: VersionHistory[];
}

interface VersionHistory {
  id: string;
  timestamp: number;
  data: Partial<AdVersion>;
  note: string;
}

interface Metrics {
  impressions: number;
  clicks: number;
  conversions: number;
}

interface ExperimentState {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed';
  versions: AdVersion[];
  metrics: Record<string, Metrics>;
  historyData: Record<string, { timestamp: number; metrics: Metrics }[]>;
  startTime: number | null;
  durationHours: number;
}

const AdLab: React.FC = () => {
  const [experiment, setExperiment] = useState<ExperimentState | null>(null);
  const [activeTab, setActiveTab] = useState<'lab' | 'dashboard' | 'versions'>('dashboard');
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [trafficPercentages, setTrafficPercentages] = useState<Record<string, number>>({});
  const [durationHours, setDurationHours] = useState(24);
  const [experimentName, setExperimentName] = useState('夏季促销活动测试');
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const loadExperiment = useCallback(async () => {
    try {
      const res = await axios.get(`/api/experiment/${experiment?.id || 'default'}`);
      const data = res.data;
      setExperiment(data);
      const versions = data.versions || [];
      if (selectedVersionIds.length === 0 && versions.length > 0) {
        const ids = versions.slice(0, Math.min(2, versions.length)).map((v: AdVersion) => v.id);
        setSelectedVersionIds(ids);
        const tp: Record<string, number> = {};
        ids.forEach((id, i) => {
          tp[id] = Math.floor(100 / ids.length) + (i === 0 ? 100 % ids.length : 0);
        });
        setTrafficPercentages(tp);
      }
    } catch (err) {
      console.error('加载实验失败:', err);
    }
  }, [experiment?.id, selectedVersionIds.length]);

  useEffect(() => {
    loadExperiment();
  }, []);

  useEffect(() => {
    if (experiment?.status === 'running') {
      const timer = setInterval(() => {
        loadExperiment();
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [experiment?.status, loadExperiment]);

  useEffect(() => {
    if (experiment?.status === 'completed' && !winnerId) {
      let bestId: string | null = null;
      let bestCVR = -1;
      experiment.versions.forEach(v => {
        const m = experiment.metrics[v.id];
        if (m && m.clicks > 0) {
          const cvr = m.conversions / m.clicks;
          if (cvr > bestCVR) {
            bestCVR = cvr;
            bestId = v.id;
          }
        }
      });
      if (bestId) setWinnerId(bestId);
    }
  }, [experiment, winnerId]);

  const handleReset = async () => {
    await axios.post('/api/reset');
    setWinnerId(null);
    setSelectedVersionIds([]);
    setTrafficPercentages({});
    loadExperiment();
  };

  const handlePublish = async () => {
    if (selectedVersionIds.length < 2 || selectedVersionIds.length > 5) {
      alert('请选择2-5个版本进行实验');
      return;
    }
    const total = selectedVersionIds.reduce((s, id) => s + (trafficPercentages[id] || 0), 0);
    if (total !== 100) {
      alert('流量分配比例总和必须为100%');
      return;
    }
    try {
      const res = await axios.post(`/api/experiment/${experiment?.id}/publish`, {
        versionIds: selectedVersionIds,
        trafficPercentages: selectedVersionIds.map(id => trafficPercentages[id] || 0),
        durationHours
      });
      setExperiment(res.data);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('发布失败:', err);
    }
  };

  const toggleVersionSelection = (id: string) => {
    setSelectedVersionIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        const tp = { ...trafficPercentages };
        delete tp[id];
        setTrafficPercentages(tp);
        return next;
      } else {
        if (prev.length >= 5) {
          alert('最多选择5个版本');
          return prev;
        }
        const next = [...prev, id];
        const tp: Record<string, number> = {};
        next.forEach((vid, i) => {
          tp[vid] = Math.floor(100 / next.length) + (i === 0 ? 100 % next.length : 0);
        });
        setTrafficPercentages(tp);
        return next;
      }
    });
  };

  if (!experiment) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#7dd3fc', marginTop: '1rem' }}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>🎯</div>
          <div>
            <h1 style={styles.title}>A/B测试广告创意工坊</h1>
            <p style={styles.subtitle}>实验ID: {experiment.id.slice(0, 8)}... | 状态: 
              <span style={{
                ...styles.statusBadge,
                background: experiment.status === 'running' ? 'linear-gradient(135deg, #10b981, #059669)'
                  : experiment.status === 'completed' ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)'
              }}>
                {experiment.status === 'running' ? '运行中' : experiment.status === 'completed' ? '已结束' : '草稿'}
              </span>
            </p>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.resetBtn} onClick={handleReset}>🔄 重置实验</button>
        </div>
      </header>

      <nav style={styles.tabs}>
        {[
          { id: 'dashboard', label: '📊 效果仪表盘' },
          { id: 'lab', label: '🧪 实验配置' },
          { id: 'versions', label: '📝 创意工坊' }
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {activeTab === 'dashboard' && (
          <div style={styles.dashboardContainer}>
            <CardGrid
              experiment={experiment}
              winnerId={winnerId}
              onSelectWinner={setWinnerId}
            />
            <ChartPanel experiment={experiment} />
          </div>
        )}

        {activeTab === 'lab' && (
          <div style={styles.labContainer}>
            <div style={styles.glassCard}>
              <h2 style={styles.cardTitle}>实验配置</h2>
              <div style={styles.formGroup}>
                <label style={styles.label}>实验名称</label>
                <input
                  style={styles.input}
                  value={experimentName}
                  onChange={e => setExperimentName(e.target.value)}
                  disabled={experiment.status === 'running'}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>实验持续时间 (小时)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={durationHours}
                  onChange={e => setDurationHours(Number(e.target.value))}
                  min={1}
                  disabled={experiment.status === 'running'}
                />
              </div>

              <h3 style={styles.sectionTitle}>选择广告版本 (2-5个)</h3>
              <div style={styles.versionSelectGrid}>
                {experiment.versions.map(v => (
                  <div
                    key={v.id}
                    style={{
                      ...styles.versionSelectCard,
                      ...(selectedVersionIds.includes(v.id) ? styles.versionSelected : {})
                    }}
                    onClick={() => toggleVersionSelection(v.id)}
                  >
                    {v.imageUrl && (
                      <img src={v.imageUrl} alt={v.title} style={styles.versionPreviewImg} />
                    )}
                    <div style={styles.versionSelectInfo}>
                      <strong style={styles.versionSelectTitle}>{v.title}</strong>
                      <p style={styles.versionSelectDesc}>{v.description}</p>
                    </div>
                    <div style={styles.checkbox}>
                      {selectedVersionIds.includes(v.id) ? '✓' : ''}
                    </div>
                  </div>
                ))}
              </div>

              {selectedVersionIds.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>流量分配比例</h3>
                  <div style={styles.trafficAllocation}>
                    {selectedVersionIds.map(id => {
                      const v = experiment.versions.find(x => x.id === id);
                      return (
                        <div key={id} style={styles.trafficItem}>
                          <span style={styles.trafficLabel}>{v?.title?.slice(0, 15)}...</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            style={styles.trafficInput}
                            value={trafficPercentages[id] || 0}
                            onChange={e => setTrafficPercentages(prev => ({
                              ...prev,
                              [id]: Math.min(100, Math.max(0, Number(e.target.value)))
                            }))}
                            disabled={experiment.status === 'running'}
                          />
                          <span style={styles.trafficUnit}>%</span>
                        </div>
                      );
                    })}
                    <div style={styles.trafficTotal}>
                      <span>总计: </span>
                      <strong style={{
                        color: selectedVersionIds.reduce((s, id) => s + (trafficPercentages[id] || 0), 0) === 100 ? '#10b981' : '#ef4444'
                      }}>
                        {selectedVersionIds.reduce((s, id) => s + (trafficPercentages[id] || 0), 0)}%
                      </strong>
                    </div>
                  </div>
                </>
              )}

              <button
                style={{
                  ...styles.publishBtn,
                  ...(experiment.status === 'running' ? styles.btnDisabled : {})
                }}
                onClick={handlePublish}
                disabled={experiment.status === 'running'}
              >
                {experiment.status === 'running' ? '实验运行中...' : '🚀 发布实验'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <VersionPanel experiment={experiment} onUpdate={loadExperiment} />
        )}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a1628 0%, #0f2847 50%, #0a1628 100%)',
    color: '#e2e8f0'
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a1628 0%, #0f2847 100%)'
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid rgba(34, 211, 238, 0.2)',
    borderTopColor: '#22d3ee',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid rgba(34, 211, 238, 0.15)',
    background: 'rgba(10, 22, 40, 0.8)',
    backdropFilter: 'blur(10px)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  logo: {
    fontSize: '2.5rem'
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #22d3ee, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.875rem',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  statusBadge: {
    padding: '0.125rem 0.625rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'white'
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem'
  },
  resetBtn: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: '1px solid rgba(34, 211, 238, 0.3)',
    background: 'rgba(34, 211, 238, 0.1)',
    color: '#22d3ee',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all 0.2s'
  },
  tabs: {
    display: 'flex',
    gap: '0.25rem',
    padding: '1rem 2rem 0',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
  },
  tab: {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 500,
    borderRadius: '8px 8px 0 0',
    transition: 'all 0.2s'
  },
  tabActive: {
    color: '#22d3ee',
    background: 'rgba(34, 211, 238, 0.1)',
    borderBottom: '2px solid #22d3ee'
  },
  main: {
    padding: '2rem'
  },
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  labContainer: {
    maxWidth: '900px',
    margin: '0 auto'
  },
  glassCard: {
    background: 'rgba(15, 40, 71, 0.6)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(34, 211, 238, 0.15)',
    borderRadius: '16px',
    padding: '2rem'
  },
  cardTitle: {
    margin: '0 0 1.5rem 0',
    fontSize: '1.25rem',
    color: '#22d3ee'
  },
  sectionTitle: {
    margin: '1.5rem 0 1rem 0',
    fontSize: '1rem',
    color: '#7dd3fc'
  },
  formGroup: {
    marginBottom: '1.25rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    color: '#94a3b8'
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(34, 211, 238, 0.2)',
    background: 'rgba(10, 22, 40, 0.6)',
    color: '#e2e8f0',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box'
  },
  versionSelectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem'
  },
  versionSelectCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '12px',
    border: '2px solid rgba(148, 163, 184, 0.15)',
    background: 'rgba(10, 22, 40, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative'
  },
  versionSelected: {
    borderColor: '#22d3ee',
    background: 'rgba(34, 211, 238, 0.1)'
  },
  versionPreviewImg: {
    width: '56px',
    height: '56px',
    borderRadius: '8px',
    objectFit: 'cover'
  },
  versionSelectInfo: {
    flex: 1,
    minWidth: 0
  },
  versionSelectTitle: {
    display: 'block',
    color: '#e2e8f0',
    fontSize: '0.9rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  versionSelectDesc: {
    margin: '0.125rem 0 0 0',
    color: '#94a3b8',
    fontSize: '0.75rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  checkbox: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    border: '2px solid rgba(148, 163, 184, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#22d3ee',
    fontWeight: 700
  },
  trafficAllocation: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    background: 'rgba(10, 22, 40, 0.4)',
    borderRadius: '12px'
  },
  trafficItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  trafficLabel: {
    width: '150px',
    fontSize: '0.85rem',
    color: '#94a3b8'
  },
  trafficInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid rgba(34, 211, 238, 0.2)',
    background: 'rgba(10, 22, 40, 0.6)',
    color: '#e2e8f0',
    width: '80px'
  },
  trafficUnit: {
    color: '#94a3b8',
    width: '24px'
  },
  trafficTotal: {
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    fontSize: '0.9rem',
    color: '#94a3b8',
    textAlign: 'right'
  },
  publishBtn: {
    width: '100%',
    marginTop: '1.5rem',
    padding: '1rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #22d3ee 0%, #34d399 100%)',
    color: '#0a1628',
    fontSize: '1.05rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.2); }
    50% { box-shadow: 0 0 40px rgba(34, 211, 238, 0.4); }
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
`;
document.head.appendChild(styleTag);

export default AdLab;
