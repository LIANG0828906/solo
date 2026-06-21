import React from 'react';
import { Undo2, X } from 'lucide-react';
import { useBookmarkStore } from '@/store';
import styles from './UndoToast.module.css';

export const UndoToast: React.FC = () => {
  const deletedBookmark = useBookmarkStore((state) => state.deletedBookmark);
  const undoDelete = useBookmarkStore((state) => state.undoDelete);
  const clearDeletedBookmark = useBookmarkStore((state) => state.clearDeletedBookmark);

  if (!deletedBookmark) return null;

  const handleUndo = () => {
    undoDelete();
  };

  const handleDismiss = () => {
    clearDeletedBookmark();
  };

  return (
    <div className={styles.toast} role="alert">
      <div className={styles.content}>
        <span className={styles.message}>
          已删除 &quot;{deletedBookmark.bookmark.title.slice(0, 30)}
          {deletedBookmark.bookmark.title.length > 30 ? '...' : ''}&quot;
        </span>
        <button className={styles.undoBtn} onClick={handleUndo}>
          <Undo2 size={16} />
          撤销
        </button>
      </div>
      <button className={styles.closeBtn} onClick={handleDismiss} aria-label="关闭">
        <X size={16} />
      </button>
    </div>
  );
};
