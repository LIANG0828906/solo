import React, { useEffect, useRef, useState } from 'react';
import { useGraphStore } from '../store';
import styles from './SearchBar.module.css';

export const SearchBar: React.FC = () => {
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setSearch = useGraphStore((s) => s.setSearch);
  const [value, setValue] = useState(searchQuery);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSearch(value);
    }, 180);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, setSearch]);

  return (
    <div className={styles.wrapper}>
      <span className={styles.icon}>🔍</span>
      <input
        type="text"
        className={styles.input}
        placeholder="输入文件名或导入路径"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {value && (
        <button
          className={styles.clear}
          onClick={() => setValue('')}
          aria-label="clear"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
};
