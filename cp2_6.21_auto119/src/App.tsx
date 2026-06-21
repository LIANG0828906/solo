import React, { useRef } from 'react';
import { Upload, Settings, BookMarked, FolderOpen } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import { CategoryFilter } from './components/CategoryFilter';
import { BookmarkGrid } from './components/BookmarkGrid';
import { DetailPanel } from './components/DetailPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { UndoToast } from './components/UndoToast';
import { useBookmarkStore } from './store';
import styles from './App.module.css';

export const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importBookmarks = useBookmarkStore((state) => state.importBookmarks);
  const setShowSettings = useBookmarkStore((state) => state.setShowSettings);
  const showSettings = useBookmarkStore((state) => state.showSettings);
  const importCount = useBookmarkStore((state) => state.importCount);
  const allBookmarks = useBookmarkStore((state) => state.allBookmarks);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      importBookmarks(text);
    } catch (error) {
      console.error('Failed to read file:', error);
      alert('文件读取失败，请确保文件格式正确');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <BookMarked size={24} className={styles.logoIcon} />
            <h1 className={styles.appName}>智能书签管理</h1>
          </div>

          <div className={styles.headerActions}>
            {allBookmarks.length > 0 && (
              <div className={styles.stats}>
                <FolderOpen size={16} />
                <span>
                  {allBookmarks.length} 个书签
                  {importCount > 0 && ` · 已导入 ${importCount} 个`}
                </span>
              </div>
            )}
            <button className={styles.importBtn} onClick={handleImportClick}>
              <Upload size={18} />
              导入书签
            </button>
            <button
              className={`${styles.iconBtn} ${showSettings ? styles.active : ''}`}
              onClick={() => setShowSettings(true)}
              title="分类规则设置"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.toolbar}>
        <SearchBar />
        <CategoryFilter />
      </div>

      <main className={styles.main}>
        <BookmarkGrid />
      </main>

      <DetailPanel />
      <SettingsPanel />
      <UndoToast />

      <input
        type="file"
        ref={fileInputRef}
        accept=".html,text/html"
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
    </div>
  );
};
