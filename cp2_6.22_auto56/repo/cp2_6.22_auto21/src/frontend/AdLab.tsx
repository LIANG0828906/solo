import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCw, Play, Trophy, LayoutDashboard, Layers } from 'lucide-react';
import { ExperimentData, AdVersion } from './types';
import CardGrid from './CardGrid';
import ChartPanel from './ChartPanel';
import VersionPanel from './VersionPanel';

const AdLab = () => {
  const [experiment, setExperiment] = useState<ExperimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'versions'>('dashboard');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchExperiment = useCallback(async () => {
    try {
      const res = await axios.get('/api/experiment/default');
      setExperiment(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch experiment:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiment();
    const interval = setInterval(fetchExperiment, 10000);
    return () => clearInterval(interval);
  }, [fetchExperiment]);

  const handleReset = async () => {
    try {
      await axios.post('/api/reset');
      await fetchExperiment();
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  const handlePublish = async (
    versions: AdVersion[],
    allocation: Record<string, number>,
    duration: number,
  ) => {
    try {
      const res = await axios.post(`/api/experiment/${experiment?.id || 'default'}/publish`, {
        versions,
        trafficAllocation: allocation,
        durationHours: duration,
      });
      setExperiment(res.data.experiment);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Failed to publish:', err);
    }
  };

  const handleSetWinner = async (versionId: string) => {
    try {
      await axios.post(`/api/experiment/${experiment?.id || 'default'}/winner`, {
        winnerId: versionId,
      });
      await fetchExperiment();
    } catch (err) {
      console.error('Failed to set winner:', err);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>加载中...</p>
      </div>
    );
  }

  if (!experiment) return null;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>⚡</span>
            A/B 测试广告管理平台
          </h1>
          <p style={styles.subtitle}>创意工坊 · 实验配置 · 实时效果分析</p>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.experimentId}>实验ID: {experiment.id.slice(0, 8)}</span>
          <span
            style={{
              ...styles.statusBadge,
              background:
                experiment.status === 'running'
                  ? 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(0,180,216,0.2))'
                  : experiment.status === 'ended'
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(249,115,22,0.2))'
                    : 'linear-gradient(135deg, rgba(148,163,184,0.2), rgba(100,116,139,0.2))',
              borderColor:
                experiment.status === 'running'
                  ? 'rgba(0,229,255,0.3)'
                  : experiment.status === 'ended'
                    ? 'rgba(239,68,68,0.3)'
                    : 'rgba(148,163,184,0.3)',
            }}
          >
            {experiment.status === 'running' ? (
              <><Play size={12} /> 运行中</>
            ) : experiment.status === 'ended' ? (
              <><Trophy size={12} /> 已结束</>
            ) : (
              '草稿'
            )}
          </span>
          <button onClick={handleReset} style={styles.refreshBtn} title="重置实验">
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'dashboard' ? styles.tabBtnActive : {}),
          }}
        >
          <LayoutDashboard size={16} />
          效果仪表盘
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          style={{
            ...styles.tabBtn,
            ...(activeTab === 'versions' ? styles.tabBtnActive : {}),
          }}
        >
          <Layers size={16} />
          广告创意工坊
        </button>
      </div>

      <div style={styles.refreshHint}>
        <span style={styles.refreshDot} />
        上次更新: {lastRefresh.toLocaleTimeString('zh-CN')} · 每 10 秒自动刷新
      </div>

      {activeTab === 'dashboard' ? (
        <div style={styles.dashboardContent}>
          <CardGrid
            experiment={experiment}
            onSetWinner={handleSetWinner}
          />
          <ChartPanel
            history={experiment.history}
            versions={experiment.versions}
          />
        </div>
      ) : (
        <VersionPanel
          experiment={experiment}
          onPublish={handlePublish}
          onUpdate={fetchExperiment}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    padding: '24px',
    maxWidth: '1800px',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '16px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(0,229,255,0.1)',
    borderTopColor: '#00e5ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: '14px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  titleIcon: {
    fontSize: '32px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  experimentId: {
    fontSize: '12px',
    color: '#64748b',
    fontFamily: 'monospace',
    background: 'rgba(255,255,255,0.03)',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid',
  },
  refreshBtn: {
    background: 'rgba(0,229,255,0.1)',
    border: '1px solid rgba(0,229,255,0.2)',
    color: '#00e5ff',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#94a3b8',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabBtnActive: {
    background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,212,170,0.1))',
    borderColor: 'rgba(0,229,255,0.3)',
    color: '#00e5ff',
  },
  refreshHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '24px',
  },
  refreshDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#00d4aa',
    animation: 'pulse 2s ease-in-out infinite',
  },
  dashboardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
};

export default AdLab;
