import React from 'react';
import { Search } from 'lucide-react';
import { useBookmarkStore } from '@/store';
import styles from './SearchBar.module.css';

export const SearchBar: React.FC = () => {
  const searchKeyword = useBookmarkStore((state) => state.searchKeyword);
  const setSearchKeyword = useBookmarkStore((state) => state.setSearchKeyword);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeyword(e.target.value);
  };

  return (
    <div className={styles.searchContainer}>
      <Search className={styles.searchIcon} size={18} />
      <input
        type="text"
        placeholder="搜索书签标题或URL..."
        value={searchKeyword}
        onChange={handleChange}
        className={styles.searchInput}
      />
    </div>
  );
};
