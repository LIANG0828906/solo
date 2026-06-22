import React, { useMemo } from 'react';
import { useGraphStore } from '../store';
import type { FileNode } from '../types';
import styles from './FileTree.module.css';

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className={styles.match}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

interface TreeRowProps {
  node: FileNode;
  depth: number;
  query: string;
}

const TreeRow: React.FC<TreeRowProps> = ({ node, depth, query }) => {
  const expandedDirs = useGraphStore((s) => s.expandedDirs);
  const selectedFileId = useGraphStore((s) => s.selectedFileId);
  const toggleDir = useGraphStore((s) => s.toggleDir);
  const selectFile = useGraphStore((s) => s.selectFile);
  const drillDown = useGraphStore((s) => s.drillDown);

  const expanded = expandedDirs.has(node.id);
  const isSelected = selectedFileId === node.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isDirectory) {
      toggleDir(node.id);
    } else {
      selectFile(node.id);
      drillDown(node.id);
    }
  };

  return (
    <div className={styles.node}>
      <div
        className={`${styles.row} ${isSelected ? styles.selected : ''}`}
        style={{ ['--indent' as never]: `${depth * 14 + 8}px` }}
        onClick={handleClick}
        title={node.path}
      >
        <span
          className={`${styles.caret} ${expanded ? styles.expanded : ''} ${!node.isDirectory ? styles.leaf : ''}`}
        >
          ▶
        </span>
        <span className={styles.icon}>{node.isDirectory ? '📁' : '📄'}</span>
        <span className={styles.name}>{highlightMatch(node.name, query)}</span>
      </div>
      {node.isDirectory && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeRow key={child.id} node={child} depth={depth + 1} query={query} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC = () => {
  const graph = useGraphStore((s) => s.graph);
  const searchQuery = useGraphStore((s) => s.searchQuery);

  const roots = useMemo(() => {
    if (!graph) return [];
    return graph.nodes.filter((n) => n.parentId === undefined);
  }, [graph]);

  if (!graph) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.title}>Explorer</div>
        </div>
        <div style={{ padding: 20, color: 'var(--ctp-subtext0)', fontSize: 12 }}>Loading project…</div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>Explorer</div>
      </div>
      <div className={styles.tree}>
        {roots.map((r) => (
          <TreeRow key={r.id} node={r} depth={0} query={searchQuery} />
        ))}
      </div>
    </div>
  );
};
