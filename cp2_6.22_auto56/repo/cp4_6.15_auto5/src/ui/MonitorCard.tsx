import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  CheckResult,
  EndpointStatus,
  LATENCY_CHART_CAP_MS,
  LATENCY_DEGRADATION_THRESHOLD_MS,
  MonitoredEndpoint,
} from '../engine/types';
import { appStore } from '../store/appStore';

interface MonitorCardProps {
  endpointId: string;
}

function computeStatus(
  result: CheckResult | undefined,
  consecutiveFailures: number,
  threshold: number,
): EndpointStatus {
  if (!result) return 'unknown';
  if (consecutiveFailures >= threshold) return 'down';
  if (!result.isSuccess) return 'down';
  if (result.latency > LATENCY_DEGRADATION_THRESHOLD_MS) return 'degraded';
  return 'healthy';
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('zh-CN', { hour12: false });
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', { hour12: false });
}

const LatencyBarChart: React.FC<{ data: CheckResult[] }> = React.memo(({ data }) => {
  const barsRef = useRef<Array<HTMLDivElement | null>>([]);

  const targets = useMemo(() => {
    return data.map((r) => {
      const capped = Math.min(r.latency, LATENCY_CHART_CAP_MS);
      return (capped / LATENCY_CHART_CAP_MS) * 100;
    });
  }, [data]);

  useEffect(() => {
    const startTs = performance.now();
    const duration = 650;
    let rafId: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startTs;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);

      for (let i = 0; i < data.length; i += 1) {
        const el = barsRef.current[i];
        if (!el) continue;
        const width = targets[i] * eased;
        el.style.width = `${width}%`;
      }

      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [data, targets]);

  if (data.length === 0) {
    return (
      <div style={{ color: 'var(--color-text-muted)', fontSize: 12, padding: '8px 4px' }}>
        暂无检测数据
      </div>
    );
  }

  return (
    <div style={styles.chartContainer}>
      <div style={styles.chartGrid}>
        <div style={styles.chartGridLine}>
          <span>5s</span>
        </div>
        <div style={{ ...styles.chartGridLine, top: '50%' }}>
          <span>2.5s</span>
        </div>
        <div style={{ ...styles.chartGridLine, top: 'auto', bottom: 0, borderBottom: 'none', borderTop: '1px solid var(--color-border)' }}>
          <span>0</span>
        </div>
      </div>
      <div style={styles.chartBars}>
        {data.map((r, i) => {
          const color = r.isSuccess
            ? r.latency > LATENCY_DEGRADATION_THRESHOLD_MS
              ? 'var(--color-accent-warning-soft)'
              : 'var(--color-accent-success)'
            : 'var(--color-accent-warning)';
          return (
            <div
              key={`${r.timestamp}-${i}`}
              style={styles.barOuter}
              title={`${formatTime(r.timestamp)} · ${formatDuration(r.latency)}${r.isSuccess ? '' : ` · ${r.errorMessage || '失败'}`}`}
            >
              <div
                ref={(el) => { barsRef.current[i] = el; }}
                style={{
                  ...styles.barInner,
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}55`,
                  willChange: 'width',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={styles.chartFooter}>
        {data.length >= 2 && (
          <>
            <span style={styles.chartAxisLabel}>{formatTime(data[0].timestamp)}</span>
            <span style={styles.chartAxisLabelCenter}>延迟变化趋势</span>
            <span style={styles.chartAxisLabel}>{formatTime(data[data.length - 1].timestamp)}</span>
          </>
        )}
      </div>
    </div>
  );
});
LatencyBarChart.displayName = 'LatencyBarChart';

export const MonitorCard: React.FC<MonitorCardProps> = React.memo(({ endpointId }) => {
  const [localState, setLocalState] = useState<{
    endpoint?: MonitoredEndpoint;
    latest?: CheckResult;
    recent: CheckResult[];
    history: CheckResult[];
    consecutiveFailures: number;
    isActiveFailure: boolean;
  }>({
    recent: [],
    history: [],
    consecutiveFailures: 0,
    isActiveFailure: false,
  });
  const [expanded, setExpanded] = useState(false);
  const prevStatusRef = useRef<EndpointStatus>('unknown');

  useEffect(() => {
    const handler = (s: AppState) => {
      const ep = s.endpoints.find((e) => e.id === endpointId);
      const latest = s.latestResults[endpointId];
      const hist = s.resultHistory[endpointId] ?? [];
      const recent = hist.slice(-3).reverse();
      setLocalState({
        endpoint: ep,
        latest,
        recent,
        history: hist.slice(-60),
        consecutiveFailures: s.consecutiveFailures[endpointId] ?? 0,
        isActiveFailure: !!s.activeFailures[endpointId],
      });
    };
    return appStore.subscribe(handler);
  }, [endpointId]);

  const { endpoint, latest, recent, history, consecutiveFailures, isActiveFailure } = localState;

  if (!endpoint) return null;

  const threshold = endpoint.failureThreshold;
  const status: EndpointStatus = computeStatus(latest, consecutiveFailures, threshold);
  const statusChanged = prevStatusRef.current !== status;
  prevStatusRef.current = status;

  const statusText: Record<EndpointStatus, string> = {
    healthy: '正常运行',
    degraded: '响应较慢',
    down: '服务异常',
    unknown: '等待检测',
  };

  const statusClass = `status-indicator status-${status} ${status === 'down' ? 'status-pulse' : ''}`;

  const handleManualCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    appStore.triggerManualCheck(endpointId);
  };

  return (
    <div
      style={{
        ...styles.card,
        ...(expanded ? styles.cardExpanded : {}),
      }}
      className={statusChanged && status !== 'unknown' ? 'anim-float-up' : ''}
      onClick={() => setExpanded((v) => !v)}
    >
      <div style={styles.cardHeader}>
        <div style={styles.headerLeft}>
          <div className={statusClass} />
          <div style={styles.headerText}>
            <div style={styles.endpointName}>{endpoint.name}</div>
            <div style={styles.endpointUrl} title={endpoint.url}>
              {endpoint.url.length > 42 ? endpoint.url.slice(0, 42) + '…' : endpoint.url}
            </div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <span
            className={`badge ${
              status === 'healthy'
                ? 'badge-success'
                : status === 'degraded'
                ? 'badge-warning'
                : status === 'down'
                ? 'badge-danger'
                : 'badge-muted'
            }`}
          >
            {statusText[status]}
          </span>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>延迟</span>
          <span style={{ ...styles.statValue, fontFamily: 'var(--font-mono)' }}>
            {latest ? formatDuration(latest.latency) : '--'}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>状态码</span>
          <span style={{ ...styles.statValue, fontFamily: 'var(--font-mono)' }}>
            {latest ? (latest.statusCode ?? 'N/A') : '--'}
          </span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>间隔</span>
          <span style={{ ...styles.statValue, fontFamily: 'var(--font-mono)' }}>
            {endpoint.interval}s
          </span>
        </div>
      </div>

      <div style={styles.timelineSection}>
        <div style={styles.timelineLabel}>最近三次检测</div>
        <div style={styles.timelineDots}>
          {recent.length === 0
            ? [0, 1, 2].map((i) => (
                <div key={`empty-${i}`} style={{ ...styles.timelineDot, opacity: 0.2 }} />
              ))
            : recent.map((r, i) => (
                <div
                  key={`${r.timestamp}-${i}`}
                  title={`${formatDateTime(r.timestamp)}\n${r.isSuccess ? '成功' : `失败：${r.errorMessage || '状态码 ' + (r.statusCode ?? 'N/A')}`}\n延迟：${formatDuration(r.latency)}`}
                  style={{
                    ...styles.timelineDot,
                    backgroundColor: r.isSuccess
                      ? 'var(--color-accent-success)'
                      : 'var(--color-accent-warning)',
                    boxShadow: r.isSuccess
                      ? '0 0 6px rgba(0,214,143,0.55)'
                      : '0 0 6px rgba(233,69,96,0.6)',
                    animation: `dotAppear 300ms ease ${i * 60}ms both`,
                  }}
                />
              ))}
          <div style={styles.timelineLine} />
        </div>
        {isActiveFailure && (
          <div style={styles.failureAlert}>
            ⚠️ 连续失败 {consecutiveFailures} 次
          </div>
        )}
      </div>

      <div style={styles.actionsRow}>
        <button
          className="btn btn-sm btn-secondary"
          onClick={handleManualCheck}
          style={{ flex: 1 }}
        >
          ⟳ 立即检测
        </button>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 11, color: 'var(--color-text-muted)', padding: '8px 4px' }}>
          {latest ? `上次检测 ${formatTime(latest.timestamp)}` : '尚未检测'}
          <span style={{ marginLeft: 10 }}>▾ 详情</span>
        </div>
      </div>

      {expanded && (
        <div style={styles.detailsPanel}>
          <div style={styles.detailsHeader}>
            <span style={styles.detailsTitle}>近一小时延迟趋势</span>
            <span style={styles.detailsCount}>{history.length} 条记录</span>
          </div>
          <LatencyBarChart data={history} />

          <div style={styles.detailsHeader}>
            <span style={styles.detailsTitle}>检测记录</span>
          </div>
          <div style={styles.recordTable}>
            <div style={styles.recordHeaderRow}>
              <span>时间</span>
              <span>状态码</span>
              <span>延迟</span>
              <span>结果</span>
            </div>
            <div style={styles.recordBody}>
              {history.length === 0 ? (
                <div style={{ padding: '12px 8px', color: 'var(--color-text-muted)', fontSize: 12 }}>
                  暂无检测记录
                </div>
              ) : (
                history
                  .slice()
                  .reverse()
                  .slice(0, 15)
                  .map((r, i) => (
                    <div key={`rec-${r.timestamp}-${i}`} style={styles.recordRow}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {formatTime(r.timestamp)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {r.isTimeout ? 'TIMEOUT' : r.statusCode ?? 'ERR'}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {formatDuration(r.latency)}
                      </span>
                      <span>
                        {r.isSuccess ? (
                          <span className="badge badge-success">成功</span>
                        ) : (
                          <span className="badge badge-danger">
                            {r.errorMessage ? r.errorMessage.slice(0, 12) : '失败'}
                          </span>
                        )}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MonitorCard.displayName = 'MonitorCard';

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    background: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '18px 18px 16px',
    cursor: 'pointer',
    transition:
      'transform 260ms cubic-bezier(0.23,1,0.32,1), box-shadow 260ms ease, border-color 260ms ease',
    willChange: 'transform',
    animation: 'floatUp 420ms cubic-bezier(0.23,1,0.32,1) both',
  },
  cardExpanded: {
    borderColor: 'rgba(233,69,96,0.35)',
    boxShadow:
      '0 14px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(233,69,96,0.08)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 11,
    minWidth: 0,
    flex: 1,
  },
  headerText: {
    minWidth: 0,
    flex: 1,
  },
  endpointName: {
    color: 'var(--color-text-primary)',
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '-0.01em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  endpointUrl: {
    color: 'var(--color-text-muted)',
    fontSize: 11.5,
    fontFamily: 'var(--font-mono)',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerRight: {
    flexShrink: 0,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    padding: '12px 12px',
    background: 'rgba(15,52,96,0.35)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    marginBottom: 14,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  statLabel: {
    fontSize: 10.5,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
  },
  timelineSection: {
    marginBottom: 14,
  },
  timelineLabel: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  },
  timelineDots: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 34,
    padding: '4px 6px',
    minHeight: 24,
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: '50%',
    height: 1,
    background: 'linear-gradient(90deg, var(--color-border), var(--color-border-strong), var(--color-border))',
    zIndex: 0,
  },
  timelineDot: {
    position: 'relative',
    zIndex: 1,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--color-text-muted)',
    flexShrink: 0,
    transition: 'transform 220ms ease, background-color 400ms ease',
  },
  failureAlert: {
    marginTop: 10,
    padding: '7px 12px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(233,69,96,0.12)',
    border: '1px solid rgba(233,69,96,0.3)',
    color: 'var(--color-accent-warning)',
    fontSize: 12,
    fontWeight: 500,
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  detailsPanel: {
    marginTop: 18,
    paddingTop: 16,
    borderTop: '1px dashed var(--color-border)',
    animation: 'fadeIn 280ms ease both',
    cursor: 'default',
  },
  detailsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  detailsTitle: {
    fontSize: 12,
    color: 'var(--color-text-primary)',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  detailsCount: {
    fontSize: 11,
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  chartContainer: {
    position: 'relative',
    height: 120,
    marginBottom: 16,
  },
  chartGrid: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  chartGridLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottom: '1px dashed var(--color-border)',
    fontSize: 10,
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  chartBars: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'flex-end',
    gap: 2,
    padding: '0 4px 18px',
    overflow: 'hidden',
  },
  barOuter: {
    flex: 1,
    minWidth: 2,
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
  },
  barInner: {
    width: '0%',
    height: 'calc(100% - 20px)',
    borderRadius: '2px 2px 0 0',
    transition: 'none',
  },
  chartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
  },
  chartAxisLabel: {
    fontSize: 10,
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  chartAxisLabelCenter: {
    fontSize: 10,
    color: 'var(--color-text-muted)',
    fontFamily: 'var(--font-sans)',
    opacity: 0.6,
  },
  recordTable: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  recordHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.9fr 0.9fr 1.2fr',
    gap: 8,
    padding: '8px 12px',
    background: 'rgba(15,52,96,0.5)',
    fontSize: 11,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 500,
  },
  recordBody: {
    maxHeight: 240,
    overflowY: 'auto',
  },
  recordRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.9fr 0.9fr 1.2fr',
    gap: 8,
    padding: '7px 12px',
    alignItems: 'center',
    borderTop: '1px solid var(--color-border)',
    fontSize: 12,
    color: 'var(--color-text-secondary)',
  },
};

export default MonitorCard;
