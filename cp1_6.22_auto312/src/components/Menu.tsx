import React, { useCallback, useEffect, useRef, useState } from 'react';
import { exportData, importData } from '../plantManager';
import styles from './Menu.module.css';

interface MenuProps {
  onDataImported: () => void;
}

const formatDateForFilename = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
};

const Menu: React.FC<MenuProps> = function Menu({ onDataImported }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = useCallback(() => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantData_${formatDateForFilename(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  }, []);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
    setIsOpen(false);
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const success = importData(text);
        if (success) {
          onDataImported();
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        }
      } catch {
        // Invalid file
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onDataImported]
  );

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="菜单"
      >
        <svg
          className={styles.menuIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="5" r="1" fill="currentColor" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="19" r="1" fill="currentColor" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleExport}
          >
            <svg
              className={styles.menuItemIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出数据
          </button>
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleImportClick}
          >
            <svg
              className={styles.menuItemIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            导入数据
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className={styles.hiddenInput}
        onChange={handleFileChange}
      />

      {showSuccess && <div className={styles.successToast}>导入成功！</div>}
    </div>
  );
};

export default Menu;
