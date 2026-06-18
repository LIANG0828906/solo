import { motion } from 'framer-motion';
import { FilterType } from '../types';

interface SearchBarProps {
  searchTerm: string;
  filter: FilterType;
  onSearchChange: (term: string) => void;
  onFilterChange: (filter: FilterType) => void;
}

export default function SearchBar({
  searchTerm,
  filter,
  onSearchChange,
  onFilterChange,
}: SearchBarProps) {
  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'drifting', label: '漂流中' },
    { value: 'returned', label: '已归还' },
  ];

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ position: 'relative', width: '280px' }}
      >
        <span
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#A1887F',
            fontSize: '14px',
          }}
        >
          🔍
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索书名或读者昵称..."
          style={{
            width: '100%',
            height: '38px',
            backgroundColor: '#3E2723',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '0 14px 0 36px',
            fontSize: '13px',
            outline: 'none',
            transition: 'background-color 0.2s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = '#5D4037';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = '#3E2723';
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as FilterType)}
          style={{
            width: '180px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#FFF',
            color: '#3E2723',
            border: '1px solid #D7C4B0',
            padding: '0 12px',
            fontSize: '13px',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235D4037' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '32px',
          }}
        >
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </motion.div>
    </div>
  );
}
