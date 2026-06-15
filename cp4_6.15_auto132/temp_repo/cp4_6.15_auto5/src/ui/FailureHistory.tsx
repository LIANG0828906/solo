import React, { useEffect, useMemo, useState } from 'react';
import { AppState, FailureEvent } from '../engine/types';
import { appStore } from '../store/appStore';
import { StatCard } from './components/StatCard';

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatUptimeLong(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days} 天 ${hours} 小时 ${mins} 分`;
  if (hours > 0) return `${hours} 小时 ${mins} 分钟`;
  return `${mins} 分钟`;
}

function formatDateInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const FailureHistory: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [endpointFilter, setEndpointFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  const filteredFailures = useMemo(() => {
    if (!state) return [];
    const allFailures: FailureEvent[] = [
      ...Object.values(state.activeFailures),
      ...state.failureHistory,
    ].sort((a, b) => b.startTime - a.startTime);

    return allFailures.filter((f) => {
      if (endpointFilter !== 'all' && f.endpointId !== endpointFilter) return false;
      if (statusFilter === 'active' && f.isResolved) return false;
      if (statusFilter === 'resolved' && !f.isResolved) return false;
      if (dateFrom) {
        const fromTs = new Date(dateFrom + 'T00:00:00').getTime();
        if (f.startTime < fromTs) return false;
      }
      if (dateTo) {
        const toTs = new Date(dateTo + 'T23:59:59').getTime();
        if (f.startTime > toTs) return false;
      }
      return true;
    });
  }, [state, endpointFilter, dateFrom, dateTo, statusFilter]);

  if (!state) return null;

  const { endpoints, failureHistory, activeFailures, monitoringStartTime } = state;

  const globalStats = appStore.computeGlobalStats();

  const activeFailureCount = Object.keys(activeFailures).length;
  const resolvedFailureCount = failureHistory.filter((f) => f.isResolved).length;

  const endpointStats = endpoints.map((ep) => ({
    endpoint: ep,
    stats: appStore.computeEndpointStats(ep.id),
    activeFailure: !!activeFailures[ep.id],
  }));

  return (
    <div className="page-container">
      <div style={styles.pageHeader}>
        <div>
          <h1 className="page-title">故障历史</h1>
          <p className="page-subtitle">
            查看历史故障记录、持续时间与恢复状态，以及各端点可用率统计
          </p>
        </div>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          label="总监控时长"
          value={<span style={{ fontSize: 22 }}>{formatUptimeLong(Date.now() - monitoringStartTime)}</span>}
          icon="⏱"
          tone="default"
          subValue={`自 ${formatDateInput(monitoringStartTime)} 开始`}
        />
        <StatCard
          label="总故障次数"
          value={globalStats.totalFailureCount + activeFailureCount}
          icon="⚑"
          tone={activeFailureCount > 0 ? 'warning' : 'default'}
          subValue={`进行中 ${activeFailureCount} · 已恢复 ${resolvedFailureCount}`}
        />
        <StatCard
          label="平均可用率"
          value={`${
            endpointStats.length === 0
              ? 100
              : Math.round(
                  (endpointStats.reduce((s, e) => s + e.stats.availabilityRate, 0) /
                    endpointStats.length) *
                    100,
                ) / 100
          }%`}
          icon="✓"
          tone="success"
          subValue={`${endpointStats.length} 个端点统计`}
        />
        <StatCard
          label="当前进行中故障"
          value={activeFailureCount}
          icon="⚠"
          tone={activeFailureCount > 0 ? 'danger' : 'success'}
          subValue={activeFailureCount === 0 ? '全部服务正常' : '请尽快处理'}
        />
      </div>

      {endpoints.length > 0 && (
        <section style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>端点可用率统计</h2>
          </div>
          <div style={styles.endpointStatsGrid}>
            {endpointStats.map(({ endpoint, stats, activeFailure }) => (
              <div
                key={endpoint.id}
                style={{
                  ...styles.endpointStatCard,
                  borderColor: activeFailure ? 'rgba(233,69,96,0.35)' : 'var(--color-border)',
                }}
              >
                <div style={styles.epStatHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: activeFailure
                          ? 'var(--color-accent-warning)'
                          : stats.availabilityRate >= 99.5
                          ? 'var(--color-accent-success)'
                          : stats.availabilityRate >= 98
                          ? 'var(--color-accent-warning-soft)'
                          : 'var(--color-accent-warning)',
                        boxShadow: activeFailure
                          ? '0 0 8px rgba(233,69,96,0.7)'
                          : 'none',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          color: 'var(--color-text-primary)',
                          fontWeight: 600,
                          fontSize: 13.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {endpoint.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--color-text-muted)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {endpoint.url}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: 22,
                      color:
                        stats.availabilityRate >= 99.5
                          ? 'var(--color-accent-success)'
                          : stats.availabilityRate >= 98
                          ? 'var(--color-accent-warning-soft)'
                          : 'var(--color-accent-warning)',
                    }}
                  >
                    {stats.availabilityRate}%
                  </div>
                </div>
                <div style={styles.progressWrap}>
                  <div style={styles.progressBarOuter}>
                    <div
                      style={{
                        ...styles.progressBarInner,
                        width: `${stats.availabilityRate}%`,
                        background:
                          stats.availabilityRate >= 99.5
                            ? 'linear-gradient(90deg, #00d68f, #3ef5b4)'
                            : stats.availabilityRate >= 98
                            ? 'linear-gradient(90deg, #ffaa2c, #ffcf6e)'
                            : 'linear-gradient(90deg, #e94560, #ff6b84)',
                        transition: 'width 600ms cubic-bezier(0.23,1,0.32,1)',
                      }}
                    />
                  </div>
                </div>
                <div style={styles.epStatFooter}>
                  <div style={styles.epStatItem}>
                    <span style={styles.epStatLabel}>平均响应</span>
                    <span style={styles.epStatValue}>{stats.avgLatency}ms</span>
                  </div>
                  <div style={styles.epStatItem}>
                    <span style={styles.epStatLabel}>检测次数</span>
                    <span style={styles.epStatValue}>{stats.totalChecks}</span>
                  </div>
                  <div style={styles.epStatItem}>
                    <span style={styles.epStatLabel}>故障事件</span>
                    <span style={{ ...styles.epStatValue, color: stats.failureCount > 0 ? 'var(--color-accent-warning)' : 'var(--color-text-muted)' }}>
                      {stats.failureCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={styles.sectionCard}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            故障记录
            <span style={{ ...styles.countBadge, marginLeft: 10 }}>{filteredFailures.length}</span>
          </h2>
        </div>

        <div style={styles.filterBar}>
          <div className="form-field" style={{ minWidth: 180, flex: 1 }}>
            <label className="form-label">端点</label>
            <select
              className="form-select"
              value={endpointFilter}
              onChange={(e) => setEndpointFilter(e.target.value)}
            >
              <option value="all">全部端点</option>
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field" style={{ minWidth: 160, flex: 1 }}>
            <label className="form-label">状态</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'resolved')}
            >
              <option value="all">全部</option>
              <option value="active">进行中</option>
              <option value="resolved">已恢复</option>
            </select>
          </div>

          <div className="form-field" style={{ minWidth: 150, flex: 1 }}>
            <label className="form-label">起始日期</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="form-field" style={{ minWidth: 150, flex: 1 }}>
            <label className="form-label">结束日期</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="form-field" style={{ flex: 0, justifyContent: 'flex-end' }}>
            <label className="form-label">&nbsp;</label>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setEndpointFilter('all');
                setStatusFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
            >
              重置筛选
            </button>
          </div>
        </div>

        <div style={styles.failuresList}>
          {filteredFailures.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 24px' }}>
              <div className="empty-icon">✓</div>
              <h3>暂无符合条件的故障记录</h3>
              <p style={{ fontSize: 13, maxWidth: 380 }}>
                {Object.keys(activeFailures).length === 0 && failureHistory.length === 0
                  ? '当前还没有任何故障记录，持续监控以积累历史数据。'
                  : '请尝试调整筛选条件。'}
              </p>
            </div>
          ) : (
            filteredFailures.map((f) => {
              const ep = endpoints.find((e) => e.id === f.endpointId);
              const isExpanded = expandedId === f.id;
              const latestResult = f.checkResults[f.checkResults.length - 1];
              return (
                <div
                  key={f.id}
                  style={{
                    ...styles.failureCard,
                    borderLeft: `4px solid ${f.isResolved ? 'var(--color-accent-warning-soft)' : 'var(--color-accent-warning)'}`,
                    animation: `floatUp 420ms cubic-bezier(0.23,1,0.32,1) both`,
                  }}
                >
                  <div
                    style={styles.failureHeader}
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
                      <span
                        className={`badge ${f.isResolved ? 'badge-success' : 'badge-danger'}`}
                        style={{ flexShrink: 0, marginTop: 2 }}
                      >
                        {f.isResolved ? '已恢复' : '进行中'}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--color-text-primary)', fontSize: 14.5, fontWeight: 600 }}>
                            {ep?.name || '未知端点'}
                          </span>
                          {ep && (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                color: 'var(--color-text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 320,
                              }}
                            >
                              {ep.url}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 16,
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          <span>开始：{formatDateTime(f.startTime)}</span>
                          <span>
                            结束：{f.endTime ? formatDateTime(f.endTime) : '尚未恢复'}
                          </span>
                          <span>
                            持续：
                            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                              {f.duration
                                ? formatDuration(f.duration)
                                : formatDuration(Date.now() - f.startTime) + ' *'}
                            </span>
                          </span>
                          <span>
                            检测 {f.checkResults.length} 次
                          </span>
                          {latestResult && !latestResult.isSuccess && latestResult.errorMessage && (
                            <span style={{ color: 'var(--color-accent-warning)' }}>
                              {latestResult.errorMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        color: 'var(--color-text-muted)',
                        fontSize: 20,
                        transition: 'transform 220ms ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                        paddingLeft: 10,
                      }}
                    >
                      ▾
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={styles.failureDetails}>
                      <div style={styles.detailsSubtitle}>故障期间检测详情</div>
                      <div style={styles.detailsTable}>
                        <div style={styles.detailsHeadRow}>
                          <span>#</span>
                          <span>时间</span>
                          <span>状态码</span>
                          <span>延迟</span>
                          <span>结果</span>
                          <span>错误信息</span>
                        </div>
                        <div style={styles.detailsBody}>
                          {f.checkResults.map((r, i) => (
                            <div key={`${r.timestamp}-${i}`} style={styles.detailsRow}>
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontSize: 11.5 }}>
                                {i + 1}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                                {formatDateTime(r.timestamp)}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                                {r.isTimeout ? 'T/O' : r.statusCode ?? 'ERR'}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                                {r.latency}ms
                              </span>
                              <span>
                                {r.isSuccess ? (
                                  <span className="badge badge-success">成功</span>
                                ) : (
                                  <span className="badge badge-danger">失败</span>
                                )}
                              </span>
                              <span
                                style={{
                                  fontSize: 11.5,
                                  color: r.isSuccess
                                    ? 'var(--color-text-muted)'
                                    : 'var(--color-accent-warning)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {r.errorMessage || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    marginBottom: 24,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  sectionCard: {
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 24,
    marginBottom: 24,
    animation: 'floatUp 420ms cubic-bezier(0.23,1,0.32,1) both',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: '1px solid var(--color-border)',
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.01em',
    display: 'inline-flex',
    alignItems: 'center',
  },
  countBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 26,
    height: 22,
    padding: '0 8px',
    borderRadius: 11,
    background: 'rgba(15,52,96,0.7)',
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-primary)',
    fontWeight: 500,
  },
  endpointStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 14,
  },
  endpointStatCard: {
    padding: '16px 18px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    background:
      'linear-gradient(135deg, var(--color-bg-card) 0%, rgba(15,52,96,0.25) 100%)',
    transition: 'all 220ms ease',
  },
  epStatHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  progressWrap: {
    marginBottom: 10,
  },
  progressBarOuter: {
    height: 8,
    borderRadius: 4,
    background: 'rgba(168,178,209,0.08)',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4,
    willChange: 'width',
  },
  epStatFooter: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    paddingTop: 10,
    borderTop: '1px solid var(--color-border)',
  },
  epStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  epStatLabel: {
    fontSize: 10.5,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  epStatValue: {
    fontSize: 13,
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-primary)',
  },
  filterBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    alignItems: 'end',
    padding: '16px',
    background: 'rgba(15,52,96,0.3)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    marginBottom: 20,
  },
  failuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxHeight: 700,
    overflowY: 'auto',
  },
  failureCard: {
    background: 'rgba(15,52,96,0.25)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
  },
  failureHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'background 180ms ease',
  },
  failureDetails: {
    padding: '0 16px 16px',
    borderTop: '1px solid var(--color-border)',
    background: 'rgba(26,26,46,0.3)',
    animation: 'fadeIn 220ms ease both',
  },
  detailsSubtitle: {
    fontSize: 11.5,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 500,
    marginTop: 14,
    marginBottom: 10,
  },
  detailsTable: {
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailsHeadRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1.5fr 80px 70px 70px 2fr',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(15,52,96,0.6)',
    fontSize: 11,
    color: 'var(--color-text-muted)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  detailsBody: {
    maxHeight: 260,
    overflowY: 'auto',
  },
  detailsRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1.5fr 80px 70px 70px 2fr',
    gap: 8,
    padding: '7px 12px',
    alignItems: 'center',
    borderTop: '1px solid var(--color-border)',
    color: 'var(--color-text-secondary)',
    minWidth: 0,
  },
};

export default FailureHistory;
