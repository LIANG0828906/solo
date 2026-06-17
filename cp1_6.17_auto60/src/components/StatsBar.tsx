import React from 'react';
import { useGraphStore } from '../store';
import styles from './StatsBar.module.css';

export const StatsBar: React.FC = () => {
  const graph = useGraphStore((s) => s.graph);
  const toggleCycleModal = useGraphStore((s) => s.toggleCycleModal);

  const fileCount = graph ? graph.nodes.filter((n) => !n.isDirectory).length : 0;
  const edgeCount = graph?.edges.length ?? 0;
  const cycleCount = graph?.cycles.length ?? 0;

  return (
    <div className={styles.bar}>
      <div className={styles.item}>
        <span className={styles.label}>📄 文件</span>
        <span className={styles.value}>{fileCount}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>🔗 依赖</span>
        <span className={styles.value}>{edgeCount}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>⚠️ 循环依赖</span>
        <span
          className={`${styles.cycleValue} ${cycleCount > 0 ? 'blink' : ''}`}
          onClick={cycleCount > 0 ? toggleCycleModal : undefined}
          title={cycleCount > 0 ? '点击查看详情' : undefined}
          style={{ cursor: cycleCount > 0 ? 'pointer' : 'default' }}
        >
          {cycleCount}
        </span>
      </div>
      <div className={styles.spacer} />
      <span className={styles.demoBadge}>Demo Project</span>
    </div>
  );
};
