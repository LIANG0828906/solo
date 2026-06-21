import React from 'react';
import { X, ExternalLink, Calendar, Tag, Globe } from 'lucide-react';
import { useBookmarkStore } from '@/store';
import styles from './DetailPanel.module.css';

export const DetailPanel: React.FC = () => {
  const showDetailPanel = useBookmarkStore((state) => state.showDetailPanel);
  const selectedBookmark = useBookmarkStore((state) => state.selectedBookmark);
  const setShowDetailPanel = useBookmarkStore((state) => state.setShowDetailPanel);

  if (!showDetailPanel || !selectedBookmark) {
    return <div className={`${styles.overlay} ${styles.hidden}`} />;
  }

  const handleOpenLink = () => {
    window.open(selectedBookmark.url, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    setShowDetailPanel(false);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '未知';
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${!showDetailPanel ? styles.hidden : ''}`}
        onClick={handleClose}
      />
      <aside
        className={`${styles.panel} ${!showDetailPanel ? styles.hidden : ''}`}
        role="dialog"
        aria-label="书签详情"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>书签详情</h2>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Globe size={16} />
              标题
            </h3>
            <p className={styles.sectionValue}>{selectedBookmark.title}</p>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <ExternalLink size={16} />
              链接
            </h3>
            <a
              href={selectedBookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.urlLink}
            >
              {selectedBookmark.url}
            </a>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Tag size={16} />
              分类标签
            </h3>
            <div className={styles.tags}>
              {selectedBookmark.categories.map((category) => (
                <span key={category} className={styles.tag}>
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={16} />
              添加时间
            </h3>
            <p className={styles.sectionValue}>
              {formatDate(selectedBookmark.addedAt)}
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.openBtn} onClick={handleOpenLink}>
            <ExternalLink size={18} />
            打开链接
          </button>
        </div>
      </aside>
    </>
  );
};
