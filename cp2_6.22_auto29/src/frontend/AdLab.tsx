import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import CardGrid from './CardGrid';
import ChartPanel from './ChartPanel';
import VersionPanel from './VersionPanel';
import type { Experiment, AdVersion } from '../types';

type TabKey = 'workshop' | 'config' | 'dashboard' | 'history';

interface VersionWithMetrics extends AdVersion {
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
  };
}

interface ExperimentData extends Experiment {
  versionData?: VersionWithMetrics[];
}

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'workshop', label: '创意工坊', icon: '🎨' },
  { key: 'config', label: '实验配置', icon: '⚙️' },
  { key: 'dashboard', label: '效果仪表盘', icon: '📊' },
  { key: 'history', label: '版本历史', icon: '📜' },
];

export default function AdLab() {
  const [activeTab, setActiveTab] = useState<TabKey>('workshop');
  const [versions, setVersions] = useState<AdVersion[]>([]);
  const [experiment, setExperiment] = useState<ExperimentData | null>(null);
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([]);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [durationHours, setDurationHours] = useState(1);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await axios.get('/api/versions');
      setVersions(res.data);
    } catch {
      showMessage('error', '获取版本列表失败');
    }
  }, [showMessage]);

  const fetchExperiment = useCallback(async () => {
    if (!experiment?.id) return;
    try {
      const res = await axios.get(`/api/experiment/${experiment.id}`);
      setExperiment(res.data);
    } catch {
      // experiment may not exist yet
    }
  }, [experiment?.id]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    if (activeTab === 'dashboard' && experiment?.status === 'running') {
      if (refreshRef.current) clearInterval(refreshRef.current);
      refreshRef.current = setInterval(() => {
        fetchExperiment();
      }, 10000);
      return () => {
        if (refreshRef.current) clearInterval(refreshRef.current);
      };
    } else {
      if (refreshRef.current) clearInterval(refreshRef.current);
    }
  }, [activeTab, experiment?.status, fetchExperiment]);

  useEffect(() => {
    if (experiment?.status === 'running') {
      fetchExperiment();
    }
  }, [experiment?.id]);

  const toggleVersionSelection = (id: string) => {
    setSelectedVersionIds((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      const equalAlloc = next.length > 0 ? Math.floor(100 / next.length) : 0;
      const newAlloc: Record<string, number> = {};
      next.forEach((vid, i) => {
        newAlloc[vid] = i === 0 ? 100 - equalAlloc * (next.length - 1) : equalAlloc;
      });
      setAllocations(newAlloc);
      return next;
    });
  };

  const handleAllocationChange = (vid: string, value: number) => {
    setAllocations((prev) => ({ ...prev, [vid]: value }));
  };

  const handlePublish = async () => {
    if (selectedVersionIds.length < 2 || selectedVersionIds.length > 5) {
      showMessage('error', '请选择2-5个版本');
      return;
    }
    const total = selectedVersionIds.reduce((s, vid) => s + (allocations[vid] || 0), 0);
    if (Math.abs(total - 100) > 1) {
      showMessage('error', '流量分配比例之和须为100%');
      return;
    }
    setPublishing(true);
    try {
      const res = await axios.post('/api/experiment', {
        versionIds: selectedVersionIds,
        trafficAllocation: allocations,
        durationHours,
      });
      setExperiment(res.data);
      showMessage('success', `实验已发布，ID: ${res.data.id}`);
      setActiveTab('dashboard');
    } catch (err: any) {
      showMessage('error', err.response?.data?.error || '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const handleSelectWinner = async (versionId: string) => {
    if (!experiment) return;
    try {
      const res = await axios.post(`/api/experiment/${experiment.id}/select-winner`, { versionId });
      setExperiment(res.data);
      showMessage('success', '胜出版本已选定');
    } catch {
      showMessage('error', '选择胜出版本失败');
    }
  };

  const handleReset = async () => {
    try {
      await axios.post('/api/reset');
      setExperiment(null);
      setSelectedVersionIds([]);
      setAllocations({});
      setDurationHours(1);
      await fetchVersions();
      showMessage('success', '数据已重置');
    } catch {
      showMessage('error', '重置失败');
    }
  };

  const handleRefresh = () => {
    fetchExperiment();
    fetchVersions();
  };

  const tabLabels: Record<TabKey, string> = {
    workshop: '创意工坊',
    config: '实验配置',
    dashboard: '效果仪表盘',
    history: '版本历史',
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>⚡</span>
            <span style={styles.logoText}>A/B Ad Lab</span>
          </div>
        </div>
        <nav style={styles.nav}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.tabBtn,
                ...(activeTab === tab.key ? styles.tabBtnActive : {}),
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div style={styles.headerRight}>
          {experiment?.status === 'running' && (
            <div style={styles.liveIndicator}>
              <span style={styles.liveDot} />
              <span style={styles.liveText}>LIVE</span>
            </div>
          )}
          <button onClick={handleRefresh} style={styles.refreshBtn} title="刷新数据">
            ↻
          </button>
          <button onClick={handleReset} style={styles.resetBtn}>重置</button>
        </div>
      </header>

      {message && (
        <div style={{ ...styles.messageBar, ...(message.type === 'success' ? styles.messageSuccess : styles.messageError) }}>
          {message.text}
        </div>
      )}

      <main style={styles.main}>
        {activeTab === 'workshop' && (
          <VersionPanel mode="edit" onVersionsChange={fetchVersions} />
        )}

        {activeTab === 'config' && (
          <div style={styles.configContainer}>
            <div style={styles.configSection}>
              <h2 style={styles.sectionTitle}>实验配置与发布</h2>
              <p style={styles.sectionDesc}>选择2-5个广告版本，设置流量分配和实验时长，然后发布实验。</p>

              <div style={styles.configCard}>
                <h3 style={styles.configSubTitle}>选择版本</h3>
                <div style={styles.versionSelectGrid}>
                  {versions.map((v) => (
                    <label key={v.id} style={{
                      ...styles.versionSelectItem,
                      ...(selectedVersionIds.includes(v.id) ? styles.versionSelectItemActive : {}),
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedVersionIds.includes(v.id)}
                        onChange={() => toggleVersionSelection(v.id)}
                        style={styles.checkbox}
                      />
                      <div style={styles.versionSelectContent}>
                        <span style={styles.versionSelectTitle}>{v.title}</span>
                        <span style={styles.versionSelectCta}>{v.ctaText}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedVersionIds.length >= 2 && (
                <div style={styles.configCard}>
                  <h3 style={styles.configSubTitle}>流量分配</h3>
                  <div style={styles.allocationGrid}>
                    {selectedVersionIds.map((vid) => {
                      const v = versions.find((x) => x.id === vid);
                      return (
                        <div key={vid} style={styles.allocationRow}>
                          <span style={styles.allocationLabel}>{v?.title || vid}</span>
                          <input
                            type="range"
                            min={5}
                            max={95}
                            value={allocations[vid] || 0}
                            onChange={(e) => handleAllocationChange(vid, Number(e.target.value))}
                            style={styles.slider}
                          />
                          <span style={styles.allocationValue}>{allocations[vid] || 0}%</span>
                        </div>
                      );
                    })}
                    <div style={styles.allocationTotal}>
                      合计: {selectedVersionIds.reduce((s, vid) => s + (allocations[vid] || 0), 0)}%
                    </div>
                  </div>
                </div>
              )}

              {selectedVersionIds.length >= 2 && (
                <div style={styles.configCard}>
                  <h3 style={styles.configSubTitle}>实验时长</h3>
                  <div style={styles.durationRow}>
                    {[0.5, 1, 2, 4, 8, 24].map((h) => (
                      <button
                        key={h}
                        onClick={() => setDurationHours(h)}
                        style={{
                          ...styles.durationBtn,
                          ...(durationHours === h ? styles.durationBtnActive : {}),
                        }}
                      >
                        {h < 1 ? `${h * 60}分钟` : `${h}小时`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedVersionIds.length >= 2 && (
                <button
                  onClick={handlePublish}
                  disabled={publishing || experiment?.status === 'running'}
                  style={{
                    ...styles.publishBtn,
                    ...(publishing || experiment?.status === 'running' ? styles.publishBtnDisabled : {}),
                  }}
                >
                  {publishing ? '发布中...' : experiment?.status === 'running' ? '已有实验运行中' : '🚀 发布实验'}
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div style={styles.dashboardContainer}>
            {experiment ? (
              <>
                <div style={styles.dashboardHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>实时效果仪表盘</h2>
                    <p style={styles.sectionDesc}>
                      实验 ID: {experiment.id} ·
                      {experiment.status === 'running' ? ' 运行中 (每10秒刷新)' : ' 已结束'}
                      {experiment.winner && ' · 胜出版本已标记'}
                    </p>
                  </div>
                  {experiment.status === 'running' && (
                    <span style={styles.nextRefresh}>下次刷新: 10s</span>
                  )}
                </div>
                <CardGrid
                  versionData={experiment.versionData || []}
                  winnerId={experiment.winner}
                  status={experiment.status}
                  onSelectWinner={handleSelectWinner}
                />
                <ChartPanel
                  metricsHistory={experiment.metricsHistory || {}}
                  versionIds={experiment.versionIds}
                  versions={versions}
                />
              </>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📊</div>
                <h3 style={styles.emptyTitle}>暂无运行中的实验</h3>
                <p style={styles.emptyDesc}>请先在「实验配置」中发布一个实验</p>
                <button onClick={() => setActiveTab('config')} style={styles.emptyBtn}>
                  前往配置
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <VersionPanel mode="history" onVersionsChange={fetchVersions} />
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: 60,
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(12px)',
  },
  headerLeft: { display: 'flex', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  nav: { display: 'flex', gap: 4 },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    background: 'rgba(0, 229, 255, 0.1)',
    color: 'var(--accent-cyan)',
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {},
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    background: 'rgba(0, 240, 192, 0.1)',
    borderRadius: 20,
    border: '1px solid rgba(0, 240, 192, 0.2)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#00f0c0',
    animation: 'pulseGlow 2s infinite',
  },
  liveText: { fontSize: 11, fontWeight: 700, color: '#00f0c0', letterSpacing: '0.05em' },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'var(--glass-bg)',
    color: 'var(--text-secondary)',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  resetBtn: {
    padding: '6px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid rgba(255, 82, 82, 0.3)',
    background: 'rgba(255, 82, 82, 0.08)',
    color: '#ff5252',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: 1400,
    width: '100%',
    margin: '0 auto',
  },
  messageBar: {
    padding: '10px 24px',
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center',
    animation: 'fadeIn 0.3s ease',
  },
  messageSuccess: {
    background: 'rgba(0, 240, 192, 0.1)',
    color: '#00f0c0',
    borderBottom: '1px solid rgba(0, 240, 192, 0.2)',
  },
  messageError: {
    background: 'rgba(255, 82, 82, 0.1)',
    color: '#ff5252',
    borderBottom: '1px solid rgba(255, 82, 82, 0.2)',
  },
  configContainer: { animation: 'fadeIn 0.3s ease' },
  configSection: { maxWidth: 720, margin: '0 auto' },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  sectionDesc: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 },
  configCard: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 20,
    marginBottom: 16,
    backdropFilter: 'blur(12px)',
  },
  configSubTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 12,
  },
  versionSelectGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
  versionSelectItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  versionSelectItemActive: {
    border: '1px solid var(--accent-cyan)',
    background: 'rgba(0, 229, 255, 0.06)',
  },
  checkbox: { width: 16, height: 16, accentColor: 'var(--accent-cyan)' },
  versionSelectContent: { display: 'flex', flexDirection: 'column', gap: 2 },
  versionSelectTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  versionSelectCta: { fontSize: 12, color: 'var(--text-secondary)' },
  allocationGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  allocationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  allocationLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    width: 140,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  slider: {
    flex: 1,
    height: 4,
    accentColor: 'var(--accent-cyan)',
    cursor: 'pointer',
  },
  allocationValue: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--accent-cyan)',
    width: 48,
    textAlign: 'right' as const,
  },
  allocationTotal: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    textAlign: 'right' as const,
    paddingTop: 4,
    borderTop: '1px solid var(--border-color)',
  },
  durationRow: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  durationBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  durationBtnActive: {
    border: '1px solid var(--accent-cyan)',
    background: 'rgba(0, 229, 255, 0.1)',
    color: 'var(--accent-cyan)',
  },
  publishBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: 8,
  },
  publishBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  dashboardContainer: { animation: 'fadeIn 0.3s ease' },
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  nextRefresh: {
    fontSize: 11,
    color: 'var(--text-muted)',
    padding: '4px 10px',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    animation: 'fadeIn 0.4s ease',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 },
  emptyBtn: {
    padding: '10px 24px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
