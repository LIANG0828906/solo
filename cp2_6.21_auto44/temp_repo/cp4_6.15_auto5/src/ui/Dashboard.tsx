import React, { useEffect, useState } from 'react';
import { AppState } from '../engine/types';
import { appStore } from '../store/appStore';
import { MonitorCard } from './MonitorCard';
import { StatCard } from './components/StatCard';

function formatUptimeDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}天 ${hours}小时 ${minutes}分钟`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
}

export const Dashboard: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    return appStore.subscribe((s) => setState(s));
  }, []);

  if (!state) return null;

  const { endpoints, activeFailures } = state;
  const stats = appStore.computeGlobalStats();

  const orderedEndpoints = [...endpoints].sort((a, b) => {
    const aDown = !!activeFailures[a.id];
    const bDown = !!activeFailures[b.id];
    if (aDown !== bDown) return aDown ? -1 : 1;
    return a.createdAt - b.createdAt;
  });

  const renderSummaryPanel = (horizontal = false) => (
    <div
      style={{
        ...styles.summaryPanel,
        ...(horizontal ? styles.summaryPanelHorizontal : {}),
      }}
    >
      <div style={styles.summaryTitle}>
        <span style={styles.summaryTitleText}>全局状态</span>
        {stats.activeDownCount > 0 && (
          <span className="badge badge-danger" style={{ marginLeft: 8 }}>
            {stats.activeDownCount} 异常
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: horizontal ? 'repeat(3, 1fr)' : '1fr',
        }}
      >
        <StatCard
          label="监控端点"
          value={stats.totalEndpoints}
          icon="◎"
          tone="default"
          subValue={`${Object.keys(state.latestResults).length} 个已采样`}
        />
        <StatCard
          label="当前异常"
          value={stats.activeDownCount}
          icon="⚠"
          tone={stats.activeDownCount > 0 ? 'danger' : 'success'}
          subValue={
            stats.activeDownCount > 0
              ? '请查看故障端点'
              : endpoints.length === 0
              ? '添加端点后开始监控'
              : '全部服务正常'
          }
        />
        <StatCard
          label="今日可用率"
          value={`${stats.todayAvailability}%`}
          icon="✓"
          tone={
            stats.todayAvailability >= 99.5
              ? 'success'
              : stats.todayAvailability >= 98
              ? 'warning'
              : 'danger'
          }
          subValue={
            endpoints.length === 0
              ? '暂无采样数据'
              : `总故障 ${stats.totalFailureCount} 次`
          }
        />
        {!horizontal && (
          <StatCard
            label="监控时长"
            value={<span style={{ fontSize: 20 }}>{formatUptimeDuration(stats.totalMonitoringMs)}</span>}
            icon="⏱"
            tone="default"
            subValue={`共 ${stats.totalFailureCount} 次故障事件`}
          />
        )}
      </div>

      {!horizontal && endpoints.length > 0 && (
        <div style={styles.quickList}>
          <div style={styles.quickListTitle}>端点速览</div>
          <div style={{ overflowY: 'auto', maxHeight: 260, paddingRight: 4 }}>
            {orderedEndpoints.map((ep) => {
              const latest = state.latestResults[ep.id];
              const failCount = state.consecutiveFailures[ep.id] ?? 0;
              const isDown = !!state.activeFailures[ep.id];
              const isDegraded =
                latest && latest.isSuccess && latest.latency > 2000;
              const color = isDown
                ? 'var(--color-accent-warning)'
                : isDegraded
                ? 'var(--color-accent-warning-soft)'
                : latest
                ? 'var(--color-accent-success)'
                : 'var(--color-text-muted)';
              return (
                <div key={ep.id} style={styles.quickItem}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}99`, flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--color-text-primary)', fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ep.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                      {latest ? `${latest.latency}ms` : '--'}
                      {isDown ? ` · 连续失败${failCount}次` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <div style={styles.pageHeader}>
        <div>
          <h1 className="page-title">实时监控看板</h1>
          <p className="page-subtitle">
            {endpoints.length === 0
              ? '暂无监控端点，请前往设置页面添加服务'
              : `正在监控 ${endpoints.length} 个端点 · 每 ${orderedEndpoints
                  .map((e) => e.interval)
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .sort((a, b) => a - b)
                  .join('/')} 秒轮询`}
          </p>
        </div>
      </div>

      <div style={styles.mobileSummary}>{renderSummaryPanel(true)}</div>

      <div style={styles.mainLayout}>
        <div style={styles.cardGrid}>
          {orderedEndpoints.length === 0 ? (
            <div style={styles.emptyCard}>
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">◎</div>
                <h3>还没有监控端点</h3>
                <p style={{ fontSize: 13, maxWidth: 360 }}>
                  前往设置页面，添加您需要监控的网站或 API 端点，系统将按配置的频率定期发起健康检查。
                </p>
                <a
                  href="#/settings"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', marginTop: 8 }}
                >
                  + 添加第一个端点
                </a>
              </div>
            </div>
          ) : (
            orderedEndpoints.map((ep, idx) => (
              <div
                key={ep.id}
                style={{ animation: `floatUp 420ms cubic-bezier(0.23,1,0.32,1) ${idx * 50}ms both` }}
              >
                <MonitorCard endpointId={ep.id} />
              </div>
            ))
          )}
        </div>

        <aside style={styles.summaryWrap}>{renderSummaryPanel(false)}</aside>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    marginBottom: 24,
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 320px',
    gap: 24,
    alignItems: 'start',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 18,
    minWidth: 0,
  },
  emptyCard: {
    gridColumn: '1 / -1',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--color-border)',
  },
  summaryWrap: {
    position: 'sticky',
    top: 88,
  },
  summaryPanel: {
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: 20,
  },
  summaryPanelHorizontal: {
    padding: '14px 16px',
  },
  summaryTitle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottom: '1px solid var(--color-border)',
  },
  summaryTitleText: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    letterSpacing: '-0.01em',
  },
  mobileSummary: {
    display: 'none',
    marginBottom: 20,
  },
  quickList: {
    marginTop: 18,
    paddingTop: 14,
    borderTop: '1px solid var(--color-border)',
  },
  quickListTitle: {
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 10,
  },
  quickItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '7px 6px',
    borderRadius: 8,
    transition: 'background 180ms ease',
  },
};

const responsiveStyle = document.createElement('style');
responsiveStyle.textContent = `
  @media (min-width: 1024px) {
    .dashboard-card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 1023px) and (min-width: 769px) {
    .dashboard-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
  @media (max-width: 768px) {
    .dashboard-main-layout { grid-template-columns: 1fr !important; }
    .dashboard-summary-wrap { display: none !important; }
    .dashboard-mobile-summary { display: block !important; }
    .dashboard-card-grid { grid-template-columns: 1fr !important; }
  }
`;
document.head.appendChild(responsiveStyle);

Object.defineProperty(styles, 'cardGrid', {
  get() {
    return {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      gap: 18,
      minWidth: 0,
    };
  },
});

export default Dashboard;
