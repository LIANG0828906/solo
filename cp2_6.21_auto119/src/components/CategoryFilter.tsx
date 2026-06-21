import React from 'react';
import { Filter } from 'lucide-react';
import { useBookmarkStore, useCategories } from '@/store';
import styles from './CategoryFilter.module.css';

export const CategoryFilter: React.FC = () => {
  const categories = useCategories();
  const selectedCategory = useBookmarkStore((state) => state.selectedCategory);
  const setSelectedCategory = useBookmarkStore((state) => state.setSelectedCategory);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCategory(value === '' ? null : value);
  };

  return (
    <div className={styles.filterContainer}>
      <Filter className={styles.filterIcon} size={18} />
      <select
        value={selectedCategory || ''}
        onChange={handleChange}
        className={styles.select}
      >
        <option value="">全部分类</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
};
