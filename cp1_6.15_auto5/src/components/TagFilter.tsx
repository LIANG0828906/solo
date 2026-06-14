import styles from './TagFilter.module.css';

interface TagFilterProps {
  tags: string[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

function TagFilter({ tags, activeFilter, onFilterChange }: TagFilterProps) {
  return (
    <div className={styles.filterContainer}>
      <span className={styles.label}>菜系筛选：</span>
      <div className={styles.tags}>
        <button
          className={`${styles.tag} ${activeFilter === null ? styles.active : ''}`}
          onClick={() => onFilterChange(null)}
        >
          全部
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            className={`${styles.tag} ${activeFilter === tag ? styles.active : ''}`}
            onClick={() => onFilterChange(activeFilter === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TagFilter;
