import React, { useEffect, useRef } from 'react';
import { GraphRenderer } from '../modules/graph/GraphRenderer';
import { useGraphStore } from '../store';
import type { FileNode } from '../types';
import styles from './GraphView.module.css';

export const GraphView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GraphRenderer | null>(null);
  const graph = useGraphStore((s) => s.graph);
  const selectFile = useGraphStore((s) => s.selectFile);
  const drillDown = useGraphStore((s) => s.drillDown);
  const selectedFileId = useGraphStore((s) => s.selectedFileId);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const breadcrumbs = useGraphStore((s) => s.breadcrumbs);

  useEffect(() => {
    if (!containerRef.current) return;
    const renderer = new GraphRenderer(containerRef.current, {
      onNodeClick: (node: FileNode) => selectFile(node.id),
      onNodeDoubleClick: (node: FileNode) => {
        selectFile(node.id);
        drillDown(node.id);
      },
      onBackgroundClick: () => selectFile(null),
    });
    rendererRef.current = renderer;
    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [selectFile, drillDown]);

  useEffect(() => {
    if (rendererRef.current && graph) {
      rendererRef.current.render(graph);
    }
  }, [graph, breadcrumbs]);

  useEffect(() => {
    rendererRef.current?.highlightNode(selectedFileId);
  }, [selectedFileId]);

  useEffect(() => {
    rendererRef.current?.setSearchQuery(searchQuery);
  }, [searchQuery]);

  const handleFit = () => {
    rendererRef.current?.fitToView();
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {!graph && (
        <div className={styles.placeholder}>
          <div style={{ fontSize: 28 }}>🕸️</div>
          <div>正在加载项目依赖图…</div>
        </div>
      )}
      <button type="button" className={styles.fitBtn} onClick={handleFit} title="适应视图">
        ⤢
      </button>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#A6E3A1' }} />
          <span>内部模块</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#89B4FA' }} />
          <span>外部包</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ background: '#F38BA8' }} />
          <span>命名空间</span>
        </div>
      </div>
    </div>
  );
};
