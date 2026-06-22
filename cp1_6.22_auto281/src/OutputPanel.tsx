import React, { useEffect, useRef } from 'react';
import { Element } from './synthesisData';

export interface LogEntry {
  id: number;
  timestamp: Date;
  inputs: string[];
  output: Element;
}

interface OutputPanelProps {
  gold: number;
  goldPerSecond: number;
  logs: LogEntry[];
}

const OutputPanel: React.FC<OutputPanelProps> = React.memo(({ gold, goldPerSecond, logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const renderStars = (rarity: number) => '★'.repeat(rarity);

  return (
    <div style={styles.container}>
      <div style={styles.statsSection}>
        <h2 style={styles.statsTitle}>产出统计</h2>
        <div style={styles.goldRow}>
          <div style={styles.goldLabel}>金币</div>
          <div style={styles.goldValue}>{Math.floor(gold).toLocaleString()}</div>
          <div style={styles.goldRate}>{goldPerSecond.toFixed(1)} / 秒</div>
        </div>
      </div>

      <div style={styles.logSection}>
        <h3 style={styles.logTitle}>合成日志</h3>
        <div ref={logContainerRef} style={styles.logContainer}>
          {logs.length === 0 ? (
            <div style={styles.emptyLog}>暂无合成记录</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} style={styles.logItem}>
                <span style={styles.logTime}>[{formatTime(log.timestamp)}]</span>{' '}
                <span style={styles.logText}>
                  合成成功：{log.inputs.join(' + ')} ={' '}
                  <span style={{ color: log.output.color, fontWeight: 600 }}>
                    {log.output.name}
                  </span>
                  （稀有度
                  <span style={styles.logStars}>{renderStars(log.output.rarity)}</span>）
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

OutputPanel.displayName = 'OutputPanel';

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: 250,
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 16,
    boxSizing: 'border-box',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  statsSection: {
    borderBottom: '1px solid #2A2A3E',
    paddingBottom: 16,
  },
  statsTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 600,
    margin: '0 0 12px 0',
    textAlign: 'center',
  },
  goldRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  goldLabel: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  goldValue: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.2,
    textShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
  },
  goldRate: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  logSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  logTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 600,
    margin: '0 0 12px 0',
  },
  logContainer: {
    height: 400,
    backgroundColor: '#00000066',
    borderRadius: 8,
    padding: 12,
    overflowY: 'auto',
    fontSize: 12,
    lineHeight: 1.6,
    willChange: 'scroll-position',
  },
  emptyLog: {
    color: '#666666',
    textAlign: 'center',
    padding: '20px 0',
    fontSize: 12,
  },
  logItem: {
    color: '#CCCCCC',
    marginBottom: 8,
    wordBreak: 'break-all',
  },
  logTime: {
    color: '#888888',
  },
  logText: {
    color: '#CCCCCC',
  },
  logStars: {
    color: '#FFD700',
    marginLeft: 2,
  },
};

export default OutputPanel;
