import React from 'react';
import { BookMarked } from 'lucide-react';
import { BookmarkCard } from './BookmarkCard';
import { useFilteredBookmarks, useBookmarkStore } from '@/store';
import styles from './BookmarkGrid.module.css';

export const BookmarkGrid: React.FC = () => {
  const filteredBookmarks = useFilteredBookmarks();
  const searchKeyword = useBookmarkStore((state) => state.searchKeyword);
  const selectedCategory = useBookmarkStore((state) => state.selectedCategory);
  const allBookmarks = useBookmarkStore((state) => state.allBookmarks);

  if (allBookmarks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <BookMarked size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>暂无书签</h3>
        <p className={styles.emptyText}>
          点击右上角的"导入"按钮，上传浏览器导出的HTML书签文件开始使用
        </p>
      </div>
    );
  }

  if (filteredBookmarks.length === 0) {
    return (
      <div className={styles.emptyState}>
        <BookMarked size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>没有找到匹配的书签</h3>
        <p className={styles.emptyText}>
          {searchKeyword && `搜索关键词: "${searchKeyword}"`}
          {selectedCategory && ` 分类: "${selectedCategory}"`}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {filteredBookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          searchKeyword={searchKeyword}
        />
      ))}
    </div>
  );
};
