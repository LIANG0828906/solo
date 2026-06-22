import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import CardGrid from './CardGrid';
import ChartPanel from './ChartPanel';
import VersionPanel from './VersionPanel';
import type { Experiment, AdVersion, MetricsHistoryPoint } from '../types';
import * as localSim from '../utils/localSimulation';

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
  const [countdown, setCountdown] = useState<number>(10);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  }, []);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await axios.get('/api/versions');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setVersions(res.data);
      } else {
        localSim.initSampleLocalData();
        const local = localSim.getVersions();
        setVersions(local);
      }
    } catch {
      localSim.initSampleLocalData();
      const local = localSim.getVersions();
      setVersions(local);
    }
  }, []);

  const fetchExperiment = useCallback(async () => {
    if (!experiment?.id) return;
    try {
      const res = await axios.get(`/api/experiment/${experiment.id}`);
      if (res.data) {
        setExperiment(res.data);
      }
    } catch {
      const localExp = localSim.getExperiment();
      if (localExp) {
        const versionData: VersionWithMetrics[] = localExp.versionIds.map((vid) => {
          const v = versions.find((x) => x.id === vid);
          return {
            ...v,
            metrics: localExp.metrics[vid] || { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cvr: 0 },
          } as VersionWithMetrics;
        }).filter((v) => v.id);
        setExperiment({
          ...localExp,
          versionData,
        });
      }
    }
  }, [experiment?.id, versions]);

  const loadExperiment = useCallback(() => {
    try {
      const localExp = localSim.getExperiment();
      if (localExp) {
        const versionData: VersionWithMetrics[] = localExp.versionIds.map((vid) => {
          const v = versions.find((x) => x.id === vid) || { id: vid } as AdVersion;
          return {
            ...v,
            metrics: localExp.metrics[vid] || { impressions: 0, clicks: 0, conversions: 0, ctr: 0, cvr: 0 },
          } as VersionWithMetrics;
        });
        setExperiment({ ...localExp, versionData });
        if (localExp.status === 'running') {
          localSim.startLocalSimulation();
        }
      }
    } catch {
      // ignore
    }
  }, [versions]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  useEffect(() => {
    if (versions.length > 0) {
      loadExperiment();
    }
  }, [versions.length, loadExperiment]);

  useEffect(() => {
    if (activeTab === 'dashboard' && experiment?.status === 'running') {
      if (refreshRef.current) clearInterval(refreshRef.current);
      refreshRef.current = setInterval(() => {
        fetchExperiment();
        setCountdown(10);
      }, 10000);

      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(10);
      countdownRef.current = setInterval(() => {
        setCountdown((c) => (c > 0 ? c - 1 : 10));
      }, 1000);

      return () => {
        if (refreshRef.current) clearInterval(refreshRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    } else {
      if (refreshRef.current) clearInterval(refreshRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }, [activeTab, experiment?.status, fetchExperiment]);

  const toggleVersionSelection = (id: string) => {
    setSelectedVersionIds((prev) => {
      const isSelected = prev.includes(id);
      const next = isSelected ? prev.filter((v) => v !== id) : [...prev, id];
      if (next.length > 0) {
        const base = Math.floor(100 / next.length);
        const rem = 100 - base * next.length;
        const newAlloc: Record<string, number> = {};
        next.forEach((vid, i) => {
          newAlloc[vid] = i === 0 ? base + rem : base;
        });
        setAllocations(newAlloc);
      } else {
        setAllocations({});
      }
      return next;
    });
  };

  const handleAllocationChange = (vid: string, value: number) => {
    setAllocations((prev) => ({ ...prev, [vid]: value }));
  };

  const getTotalAllocation = () => {
    return selectedVersionIds.reduce((s, vid) => s + (allocations[vid] || 0), 0);
  };

  const handlePublish = async () => {
    if (selectedVersionIds.length < 2 || selectedVersionIds.length > 5) {
      showMessage('error', '请选择2-5个版本');
      return;
    }
    const total = getTotalAllocation();
    if (Math.abs(total - 100) > 1) {
      showMessage('error', `流量分配总和须为100%（当前: ${total}%）`);
      return;
    }

    try {
      const res = await axios.post('/api/experiment', {
        versionIds: selectedVersionIds,
        trafficAllocation: allocations,
        durationHours,
      });
      if (res.data) {
        setExperiment(res.data);
        showMessage('success', `实验已发布，ID: ${res.data.id}`);
        setActiveTab('dashboard');
        return;
      }
    } catch {
      // fall through to local
    }

    const localExp = localSim.createExperiment(
      selectedVersionIds,
      allocations,
      durationHours
    );
    localSim.startLocalSimulation();

    const versionData: VersionWithMetrics[] = selectedVersionIds.map((vid) => {
      const v = versions.find((x) => x.id === vid);
      return {
        ...v,
        metrics: localExp.metrics[vid],
      } as VersionWithMetrics;
    });

    setExperiment({ ...localExp, versionData });
    showMessage('success', `实验已发布，ID: ${localExp.id}`);
    setActiveTab('dashboard');
  };

  const handleSelectWinner = async (versionId: string) => {
    if (!experiment) return;
    try {
      const res = await axios.post(`/api/experiment/${experiment.id}/select-winner`, { versionId });
      if (res.data) {
        setExperiment(res.data);
        showMessage('success', '胜出版本已选定');
        return;
      }
    } catch {
      // fall through
    }

    const updated = localSim.selectWinner(experiment.id, versionId);
    if (updated) {
      const versionData: VersionWithMetrics[] = updated.versionIds.map((vid) => {
        const v = versions.find((x) => x.id === vid) || { id: vid } as AdVersion;
        return {
          ...v,
          metrics: updated.metrics[vid],
        } as VersionWithMetrics;
      });
      setExperiment({ ...updated, versionData });
      showMessage('success', '胜出版本已选定');
    }
  };

  const handleReset = async () => {
    if (!confirm('确定要重置所有数据吗？')) return;
    try {
      await axios.post('/api/reset');
    } catch {
      // ignore
    }
    localSim.resetAllLocalData();
    localSim.initSampleLocalData();
    setExperiment(null);
    setSelectedVersionIds([]);
    setAllocations({});
    setDurationHours(1);
    fetchVersions();
    showMessage('success', '所有数据已重置');
  };

  const handleRefresh = () => {
    fetchExperiment();
    fetchVersions();
  };

  const handleSimulateClick = (versionId: string) => {
    if (!experiment || experiment.status !== 'running') return;
    localSim.recordClick(versionId);
    fetchExperiment();
  };

  const handleSimulateImpression = (versionId: string) => {
    if (!experiment || experiment.status !== 'running') return;
    localSim.recordImpression(versionId);
    fetchExperiment();
  };

  const handleSimulateConversion = (versionId: string) => {
    if (!experiment || experiment.status !== 'running') return;
    localSim.recordConversion(versionId);
    fetchExperiment();
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
        <div style={{
          ...styles.messageBar,
          ...(message.type === 'success' ? styles.messageSuccess : styles.messageError),
          animation: 'fadeIn 0.3s ease',
        }}>
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
              <div style={styles.configHeader}>
                <div>
                  <h2 style={styles.sectionTitle}>⚙️ 实验配置与发布</h2>
                  <p style={styles.sectionDesc}>
                    选择2-5个广告版本，设置流量分配和实验时长，发布后系统将自动模拟流量并记录数据
                  </p>
                </div>
                {experiment && (
                  <div style={styles.experimentStatusBadge}>
                    {experiment.status === 'running' ? '🟢 实验运行中' : experiment.status === 'completed' ? '🔘 实验已结束' : '📋 草稿'}
                  </div>
                )}
              </div>

              {experiment && (
                <div style={styles.activeExperimentCard}>
                  <div style={styles.activeExperimentHeader}>
                    <span style={styles.activeExperimentLabel}>当前实验 ID</span>
                    <span style={styles.activeExperimentId}>{experiment.id}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    style={styles.viewDashboardBtn}
                  >
                    查看仪表盘 →
                  </button>
                </div>
              )}

              <div style={styles.configCard}>
                <div style={styles.configCardHeader}>
                  <h3 style={styles.configSubTitle}>第一步：选择广告版本</h3>
                  <span style={styles.versionCountBadge}>
                    {selectedVersionIds.length} / 5 已选择
                  </span>
                </div>
                <p style={styles.configHint}>选择2-5个版本进行A/B测试对比</p>

                {versions.length === 0 ? (
                  <div style={styles.emptyVersions}>
                    <p>暂无广告版本，请先去创意工坊创建</p>
                    <button onClick={() => setActiveTab('workshop')} style={styles.goWorkshopBtn}>
                      前往创意工坊
                    </button>
                  </div>
                ) : (
                  <div style={styles.versionSelectGrid}>
                    {versions.map((v) => {
                      const isSelected = selectedVersionIds.includes(v.id);
                      return (
                        <label
                          key={v.id}
                          style={{
                            ...styles.versionSelectItem,
                            ...(isSelected ? styles.versionSelectItemActive : {}),
                          }}
                          onClick={() => toggleVersionSelection(v.id)}
                        >
                          <div style={styles.checkboxWrapper}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={styles.checkbox}
                            />
                          </div>
                          <div style={styles.versionSelectContent}>
                            {v.imageUrl && (
                              <div style={styles.versionSelectThumb}>
                                <img src={v.imageUrl} alt="" style={styles.versionSelectThumbImg} />
                              </div>
                            )}
                            <div style={styles.versionSelectInfo}>
                              <span style={styles.versionSelectTitle}>{v.title}</span>
                              <span style={styles.versionSelectDesc}>
                                {v.description || '暂无描述'}
                              </span>
                              <span style={styles.versionSelectCta}>CTA: {v.ctaText}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <div style={styles.versionSelectBadge}>
                              {String.fromCharCode(65 + selectedVersionIds.indexOf(v.id))}
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedVersionIds.length >= 2 && (
                <div style={styles.configCard}>
                  <div style={styles.configCardHeader}>
                    <h3 style={styles.configSubTitle}>第二步：设置流量分配</h3>
                    <span style={{
                      ...styles.allocationTotalBadge,
                      ...(Math.abs(getTotalAllocation() - 100) > 1 ? styles.allocationTotalBadgeError : styles.allocationTotalBadgeOk),
                    }}>
                      总计 {getTotalAllocation()}%
                    </span>
                  </div>
                  <p style={styles.configHint}>每个版本分配的流量比例，总和须为100%</p>

                  <div style={styles.allocationList}>
                    {selectedVersionIds.map((vid, idx) => {
                      const v = versions.find((x) => x.id === vid);
                      return (
                        <div key={vid} style={styles.allocationRow}>
                          <div style={styles.allocationLabelRow}>
                            <span style={styles.allocationVersionLetter}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span style={styles.allocationVersionName}>
                              {v?.title || vid}
                            </span>
                            <span style={styles.allocationValue}>
                              {allocations[vid] || 0}%
                            </span>
                          </div>
                          <div style={styles.sliderWrapper}>
                            <input
                              type="range"
                              min={5}
                              max={90}
                              value={allocations[vid] || 0}
                              onChange={(e) => handleAllocationChange(vid, Number(e.target.value))}
                              style={{
                                ...styles.slider,
                                background: `linear-gradient(to right, var(--accent-cyan) ${(allocations[vid] || 0)}%, rgba(255,255,255,0.1) ${(allocations[vid] || 0)}%)`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={styles.quickAllocRow}>
                    <span style={styles.quickAllocLabel}>快速分配:</span>
                    <button
                      onClick={() => {
                        const newAlloc: Record<string, number> = {};
                        const n = selectedVersionIds.length;
                        const base = Math.floor(100 / n);
                        const rem = 100 - base * n;
                        selectedVersionIds.forEach((vid, i) => {
                          newAlloc[vid] = i === 0 ? base + rem : base;
                        });
                        setAllocations(newAlloc);
                      }}
                      style={styles.quickAllocBtn}
                    >
                      平均分配
                    </button>
                    <button
                      onClick={() => {
                        const newAlloc: Record<string, number> = {};
                        selectedVersionIds.forEach((vid, i) => {
                          newAlloc[vid] = i === 0 ? 50 : Math.floor(50 / (selectedVersionIds.length - 1));
                        });
                        setAllocations(newAlloc);
                      }}
                      style={styles.quickAllocBtn}
                    >
                      主打版本50%
                    </button>
                  </div>
                </div>
              )}

              {selectedVersionIds.length >= 2 && (
                <div style={styles.configCard}>
                  <div style={styles.configCardHeader}>
                    <h3 style={styles.configSubTitle}>第三步：设置实验时长</h3>
                  </div>
                  <p style={styles.configHint}>选择实验持续时间，到期后自动结束并标记胜出版本</p>

                  <div style={styles.durationOptions}>
                    {[
                      { value: 0.083, label: '5分钟', desc: '快速测试' },
                      { value: 0.5, label: '30分钟', desc: '短暂实验' },
                      { value: 1, label: '1小时', desc: '标准测试' },
                      { value: 4, label: '4小时', desc: '半日测试' },
                      { value: 24, label: '24小时', desc: '完整一天' },
                      { value: 168, label: '7天', desc: '长期测试' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDurationHours(opt.value)}
                        style={{
                          ...styles.durationOption,
                          ...(durationHours === opt.value ? styles.durationOptionActive : {}),
                        }}
                      >
                        <span style={styles.durationOptionLabel}>{opt.label}</span>
                        <span style={styles.durationOptionDesc}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedVersionIds.length >= 2 && (
                <div style={styles.publishSection}>
                  <div style={styles.publishSummary}>
                    <div>
                      <span style={styles.publishSummaryLabel}>选中版本</span>
                      <span style={styles.publishSummaryValue}>{selectedVersionIds.length} 个版本</span>
                    </div>
                    <div>
                      <span style={styles.publishSummaryLabel}>实验时长</span>
                      <span style={styles.publishSummaryValue}>
                        {durationHours < 1 ? `${durationHours * 60}分钟` : `${durationHours}小时`}
                      </span>
                    </div>
                    <div>
                      <span style={styles.publishSummaryLabel}>流量分配</span>
                      <span style={styles.publishSummaryValue}>{getTotalAllocation()}%</span>
                    </div>
                  </div>
                  <button
                    onClick={handlePublish}
                    disabled={experiment?.status === 'running' || Math.abs(getTotalAllocation() - 100) > 1}
                    style={{
                      ...styles.publishBtn,
                      ...((experiment?.status === 'running' || Math.abs(getTotalAllocation() - 100) > 1) ? styles.publishBtnDisabled : {}),
                    }}
                  >
                    {experiment?.status === 'running' ? '⏸ 已有实验运行中' : '🚀 发布实验'}
                  </button>
                </div>
              )}

              {selectedVersionIds.length < 2 && selectedVersionIds.length > 0 && (
                <div style={styles.hintCard}>
                  <span style={styles.hintIcon}>💡</span>
                  <span>请至少选择2个版本进行对比实验</span>
                </div>
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
                    <h2 style={styles.sectionTitle}>📊 实时效果仪表盘</h2>
                    <p style={styles.sectionDesc}>
                      实验 ID: <code style={styles.code}>{experiment.id}</code>
                      {' · '}
                      {experiment.status === 'running' ? (
                        <span style={styles.statusRunning}>🟢 运行中</span>
                      ) : (
                        <span style={styles.statusCompleted}>🔘 已结束</span>
                      )}
                      {experiment.winner && ' · 🏆 已产生胜出版本'}
                    </p>
                  </div>
                  {experiment.status === 'running' && (
                    <div style={styles.countdownBadge}>
                      <span>下次刷新</span>
                      <span style={styles.countdownNum}>{countdown}s</span>
                    </div>
                  )}
                </div>

                <CardGrid
                  versionData={experiment.versionData || []}
                  winnerId={experiment.winner}
                  status={experiment.status}
                  onSelectWinner={handleSelectWinner}
                  onSimulateClick={handleSimulateClick}
                  onSimulateImpression={handleSimulateImpression}
                  onSimulateConversion={handleSimulateConversion}
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
                <p style={styles.emptyDesc}>请先在「实验配置」中发布一个A/B测试实验</p>
                <button onClick={() => setActiveTab('config')} style={styles.emptyBtn}>
                  → 前往配置实验
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
    height: 64,
    background: 'rgba(12, 22, 41, 0.85)',
    borderBottom: '1px solid var(--border-color)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(16px)',
  },
  headerLeft: { display: 'flex', alignItems: 'center' },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { fontSize: 24 },
  logoText: {
    fontSize: 18,
    fontWeight: 800,
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  nav: { display: 'flex', gap: 4 },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 18px',
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
  tabIcon: { fontSize: 15 },
  tabLabel: { fontWeight: 500 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
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
  liveText: { fontSize: 11, fontWeight: 700, color: '#00f0c0', letterSpacing: '0.08em' },
  refreshBtn: {
    width: 38,
    height: 38,
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
    padding: '7px 16px',
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
    textAlign: 'center' as const,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  configContainer: { animation: 'fadeIn 0.3s ease' },
  configSection: { maxWidth: 760, margin: '0 auto' },
  configHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  experimentStatusBadge: {
    padding: '6px 14px',
    borderRadius: 20,
    background: 'rgba(0, 229, 255, 0.1)',
    color: 'var(--accent-cyan)',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid rgba(0, 229, 255, 0.2)',
  },
  activeExperimentCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08), rgba(0, 240, 192, 0.04))',
    border: '1px solid rgba(0, 229, 255, 0.2)',
    marginBottom: 16,
  },
  activeExperimentHeader: { display: 'flex', flexDirection: 'column', gap: 4 },
  activeExperimentLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  activeExperimentId: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: 'var(--accent-cyan)',
    fontWeight: 600,
  },
  viewDashboardBtn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  configCard: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 22,
    marginBottom: 16,
    backdropFilter: 'blur(12px)',
  },
  configCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  configSubTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  configHint: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginBottom: 14,
  },
  versionCountBadge: {
    padding: '3px 10px',
    borderRadius: 12,
    background: 'rgba(0, 229, 255, 0.1)',
    color: 'var(--accent-cyan)',
    fontSize: 12,
    fontWeight: 600,
  },
  emptyVersions: {
    padding: '30px',
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
    background: 'rgba(7, 13, 26, 0.3)',
    borderRadius: 'var(--radius-md)',
  },
  goWorkshopBtn: {
    marginTop: 12,
    padding: '8px 20px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--accent-cyan)',
    background: 'transparent',
    color: 'var(--accent-cyan)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  versionSelectGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  versionSelectItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'rgba(7, 13, 26, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative' as const,
  },
  versionSelectItemActive: {
    border: '1px solid var(--accent-cyan)',
    background: 'rgba(0, 229, 255, 0.06)',
  },
  checkboxWrapper: { flexShrink: 0 },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: 'var(--accent-cyan)',
    cursor: 'pointer',
  },
  versionSelectContent: {
    display: 'flex',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  versionSelectThumb: {
    width: 60,
    height: 44,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    border: '1px solid var(--border-color)',
  },
  versionSelectThumbImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  versionSelectInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  versionSelectTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  versionSelectDesc: {
    fontSize: 11,
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  versionSelectCta: {
    fontSize: 11,
    color: 'var(--accent-cyan)',
  },
  versionSelectBadge: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationTotalBadge: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
  },
  allocationTotalBadgeOk: {
    background: 'rgba(0, 240, 192, 0.1)',
    color: '#00f0c0',
  },
  allocationTotalBadgeError: {
    background: 'rgba(255, 82, 82, 0.1)',
    color: '#ff5252',
  },
  allocationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  allocationRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  allocationLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  allocationVersionLetter: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'var(--accent-gradient)',
    color: '#070d1a',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocationVersionName: {
    flex: 1,
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  allocationValue: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--accent-cyan)',
    fontVariantNumeric: 'tabular-nums',
  },
  sliderWrapper: {
    paddingLeft: 32,
  },
  slider: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    outline: 'none',
    appearance: 'none' as const,
    cursor: 'pointer',
  },
  quickAllocRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTop: '1px solid var(--border-color)',
  },
  quickAllocLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
  },
  quickAllocBtn: {
    padding: '5px 12px',
    borderRadius: 6,
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  durationOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
  },
  durationOption: {
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    background: 'rgba(7, 13, 26, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  durationOptionActive: {
    border: '1px solid var(--accent-cyan)',
    background: 'rgba(0, 229, 255, 0.08)',
  },
  durationOptionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  durationOptionDesc: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  publishSection: {
    marginTop: 20,
    padding: 20,
    borderRadius: 'var(--radius-lg)',
    background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.06), rgba(0, 240, 192, 0.03))',
    border: '1px solid rgba(0, 229, 255, 0.15)',
  },
  publishSummary: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  publishSummaryLabel: {
    display: 'block',
    fontSize: 11,
    color: 'var(--text-muted)',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  publishSummaryValue: {
    display: 'block',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center' as const,
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
  },
  publishBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  hintCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 20px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 193, 7, 0.06)',
    border: '1px solid rgba(255, 193, 7, 0.2)',
    color: '#ffc107',
    fontSize: 13,
  },
  hintIcon: { fontSize: 18 },
  dashboardContainer: { animation: 'fadeIn 0.3s ease' },
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    background: 'rgba(0, 229, 255, 0.08)',
    padding: '2px 8px',
    borderRadius: 4,
    color: 'var(--accent-cyan)',
  },
  statusRunning: { color: '#00f0c0', fontWeight: 600 },
  statusCompleted: { color: '#ffc107', fontWeight: 600 },
  countdownBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)',
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  countdownNum: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--accent-cyan)',
    fontVariantNumeric: 'tabular-nums',
  },
  emptyState: {
    padding: '80px 20px',
    textAlign: 'center' as const,
    animation: 'fadeIn 0.4s ease',
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
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
