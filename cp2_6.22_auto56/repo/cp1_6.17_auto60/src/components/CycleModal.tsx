import React from 'react';
import { useGraphStore } from '../store';
import styles from './CycleModal.module.css';

export const CycleModal: React.FC = () => {
  const show = useGraphStore((s) => s.showCycleModal);
  const toggle = useGraphStore((s) => s.toggleCycleModal);
  const graph = useGraphStore((s) => s.graph);
  const getNodeById = useGraphStore((s) => s.getNodeById);

  if (!show) return null;

  return (
    <div className={styles.overlay} onClick={toggle}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            <span className={styles.titleIcon}>⚠️</span>
            循环依赖检测结果
          </div>
          <button type="button" className={styles.close} onClick={toggle} aria-label="close">
            ✕
          </button>
        </div>
        <div className={styles.body}>
          {!graph || graph.cycles.length === 0 ? (
            <div className={styles.empty}>暂无循环依赖 🎉</div>
          ) : (
            graph.cycles.map((cycle, idx) => (
              <div key={idx} className={styles.chain}>
                {cycle.map((id, i) => {
                  const node = getNodeById(id);
                  return (
                    <React.Fragment key={`${id}-${i}`}>
                      <span className={styles.chainNode}>{node?.name ?? id}</span>
                      {i < cycle.length - 1 && <span className={styles.arrow}>→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
