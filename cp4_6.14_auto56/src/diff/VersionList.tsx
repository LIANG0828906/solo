import { Clock, FileCode, Trash2 } from 'lucide-react';
import type { CodeVersion } from '../types';
import styles from './Diff.module.css';

interface VersionListProps {
  versions: CodeVersion[];
  selectedId?: string;
  onSelect: (version: CodeVersion) => void;
  onDelete?: (id: string) => void;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function VersionList({ versions, selectedId, onSelect, onDelete }: VersionListProps) {
  if (versions.length === 0) {
    return (
      <div className={styles.emptyList}>
        <FileCode size={40} className={styles.emptyIcon} />
        <p className={styles.emptyText}>暂无保存的版本</p>
        <p className={styles.emptyHint}>点击"保存版本"按钮保存当前代码</p>
      </div>
    );
  }

  return (
    <div className={styles.versionList}>
      <div className={styles.versionListHeader}>
        <span className={styles.versionCount}>共 {versions.length} 个版本</span>
      </div>
      <div className={styles.versionItems}>
        {versions.map((version) => (
          <div
            key={version.id}
            className={`${styles.versionItem} ${selectedId === version.id ? styles.selected : ''}`}
            onClick={() => onSelect(version)}
          >
            <div className={styles.versionInfo}>
              <div className={styles.versionTime}>
                <Clock size={14} className={styles.clockIcon} />
                <span>{formatTimestamp(version.timestamp)}</span>
              </div>
              <div className={styles.versionMeta}>
                <span className={styles.lineCount}>共 {version.lineCount} 行</span>
                <span className={styles.languageTag}>{version.language}</span>
              </div>
            </div>
            {onDelete && (
              <button
                className={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(version.id);
                }}
                title="删除版本"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
